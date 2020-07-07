const Discord = require('discord.js');
const client = new Discord.Client();
const mongoose = require('mongoose');
const User = require('./user');
const Guild = require('./guild_setting');
const fs = require('fs');
const CronJob = require('cron').CronJob;
const Chart = require('./chart.js');
const { spawn } = require('child_process');
const { doesNotMatch } = require('assert');
require('dotenv-flow').config();

const config = {
    token : process.env.TOKEN,
    owner : process.env.OWNER,
    prefix : process.env.PREFIX,
    db_connection : process.env.DB_CONNECTION
}

var swear_words;

fs.readFile('swear_words.txt', 'utf8', (err, data) => {
    if(err) throw err;
    swear_words = data.toString().trim().split(/\r?\n/);
    console.log('Word bank loaded');
});

var helpMsg;

fs.readFile('help.txt', 'utf8', (err, data) => {
    if(err) throw err;
    helpMsg = data.toString();
    console.log('Help message loaded');
});

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
mongoose.connect(config.db_connection, err => {
    if(err) throw err;
    console.log("Database connected");
});

const update_streak = new CronJob('00 00 00 * * *', () => {
    User.GuildUser.updateMany({}, {
        $inc : {clean_streak : 1}
    }).then(() => {console.log('clean streak updated');});
});

client.on('ready', () => {
    update_streak.start();
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('guildCreate', guild => {
    guild.members.fetch().then(result => {
        for(const [id, member] of result) {
            if(!member.user.bot) {
                const g_id = guild.id;
                const g_name = guild.name
                User.GuildUser.findOne({discord_id : id, guild_id : g_id}, (err, docs) => {
                    if(err) throw err;
                    if(!docs)
                        User.createGuildUser(id, member.user.username, g_id, g_name);
                    else
                        console.log(`${member.displayName} already exists in the database!`);
                });
            }
        }
    });
    Guild.GuildSetting.findOne({guild_id : guild.id}, (err, docs) => {
        if(docs)
            Guild.refreshGuildSetting(guild);
        else
            Guild.createGuildSetting(guild, -1);
    });
});

client.on('guildMemberAdd', member => {
    if(member.user.bot) return;
    const id = member.user.id
    User.GuildUser.findOne({discord_id : id, guild_id : member.guild.id}, (err, docs) => {
        if(err) throw err;
        if(!docs) User.createGuildUser(id, member.user.username);
    });
});

client.on('channelCreate', channel => {
    Guild.GuildSetting.findOneAndUpdate({guild_id : channel.guild.id}, 
        {$addToSet : {channels : {name:channel.name, id:channel.id, setting:'ignore'}}}
    ).then();
});

client.on('channelDelete', channel => {
    Guild.GuildSetting.findOneAndUpdate({guild_id : channel.guild.id}, {$pull : {channels : {id:channel.id}}}).then();
});

client.on('message', msg => {
    if(msg.author.bot) return;
    //check swear words in a message
    const sentence = msg.content;
    const sender = msg.member.user.username;
    const user_query = {discord_id : msg.member.user.id, guild_id : msg.member.guild.id};
    if(sentence.slice(0, 2) !== config.prefix) {
        const tokens = sentence.trim().toLowerCase().match(/\S+/g);
        var words = 0;
        var indices = [];
        tokens.map(token => {
            swear_words.map(swear_word => {
                const index = token.indexOf(swear_word);
                if(index != -1 && !indices.includes(index)) {
                    words++;
                    indices.push(index);
                }
            });
        });
        if(words) {
            const update = { 
                $inc : { swear_usage : words },
                $set : { clean_streak : -1 },
                $addToSet : { swear_quotes : {content:sentence, date:Date.now(), usage:words} } 
            }
            User.GuildUser.findOneAndUpdate(user_query, update).then(() => {
                User.GuildUser.findOne(user_query, (err, user_data) => {
                    Guild.GuildSetting.findOne({guild_id : msg.guild.id}, (err, guild_setting) => {
                        if(err) throw err;
                        if(guild_setting.ban_threshold > 0 && user_data.swear_usage > guild_setting.ban_threshold) {
                            msg.member.ban();
                            msg.channel.send(`${msg.member.displayName} has been banned for exceeding the swear usage threshold!!`);
                        }
                    });
                });
            });
            Guild.GuildSetting.findOne({guild_id : msg.guild.id}, (err, result) => {
                for(const channel_setting of result.channels) {
                    if(channel_setting.id === msg.channel.id) {
                        if(channel_setting.setting === 'censor') {
                            msg.delete();
                            const censor = `<@${msg.member.user.id}>: ||${sentence}||`;
                            msg.channel.send('**The following message has been censored due to foul language:\n**' + censor);
                        }else if(channel_setting.setting === 'remove') {
                            msg.delete();
                            msg.reply('**your message has been deleted due to foul language**');
                        }
                        break;
                    }
                }
            });
        }
    //check commands
    }else {
        const args = msg.content.toLowerCase().slice(config.prefix.length).trim().match(/\S+/g);
        const command = args.shift();
        switch(command) {
            case "ping":
                msg.reply("pong");
                break;
            case "info":
                User.GuildUser.findOne(user_query).then(result => {
                    // const chart = Chart.getChartData(result);
                    // const python = spawn('python', ['chart.py', chart.filename, chart.x_data_str, chart.y_data_str]);
                    // console.log(`python chart.py ${chart.filename} ${chart.x_data_str} ${chart.y_data_str}`);
                    // python.on('close', code => {
                        
                    //     const img = 'attachment://' + chart.filename + '.png';
                    //     const embed = new Discord.MessageEmbed()
                    //         .setColor('0x0099ff')
                    //         .setTitle(`${msg.member.displayName}'s Swearing Profile`)
                    //         .addField('swear usage', result.swear_usage)
                    //         .addField('number of messages with swearing', result.swear_quotes.length)
                    //         .addField('clean streak', result.clean_streak)
                    //         .attachFiles([chart.path])
                    //         .setImage(img);
                        
                    //     msg.channel.send({embed : embed});
                    // });
                    const embed = new Discord.MessageEmbed()
                            .setColor('0x0099ff')
                            .setTitle(`${msg.member.displayName}'s Swearing Profile`)
                            .addField('swear usage', result.swear_usage)
                            .addField('number of messages with swearing', result.swear_quotes.length)
                            .addField('clean streak', result.clean_streak)
                        
                    msg.channel.send({embed : embed});
                });
                break;
            case "swear":
                const setting = args.shift();
                if(setting === 'ignore' || setting === 'censor' || setting === 'remove') {
                    Guild.changeGuildSetting(msg.guild, setting, args.shift());
                }else
                    msg.channel.send('invalid setting')
                break;
            case "threshold":
                const arg = args.shift();
                if(arg) {
                    if(arg.length < 9) {
                        const threshold = parseInt(arg);
                        Guild.setBanThreshold(msg.guild, threshold);
                        msg.channel.send('ban threshold updated to ' + threshold);
                    }else
                        msg.channel.send('number too big or too small');
                }else {
                    Guild.GuildSetting.findOne({guild_id : msg.guild.id}, (err, result) => {
                        if(err) throw err;
                        const threshold = result.ban_threshold;
                        var warning;
                        if(threshold > 0)
                            warning = 'Users with swear usage above this number will be banned!';
                        else
                            warning = "Seems like there's no threshold. Don't worry about getting banned for swearing."
                        const thresholdEmbed = {
                            color: 0x0099ff,
                            title: 'Swear Usage Threshold: ' + threshold,
                            description: warning
                        };
                        msg.channel.send({embed : thresholdEmbed});
                    });
                }
                break;
            case "help":
                const helpEmbed = {
                    color: 0x0099ff,
                    title: 'SwearBot Commands',
                    description : helpMsg
                };
                msg.channel.send({embed : helpEmbed});
                break;
            default:
                msg.channel.send("unknown command");
        }
    }
});

client.login(config.token);