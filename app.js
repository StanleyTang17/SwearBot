const Discord = require('discord.js');
const client = new Discord.Client();
const mongoose = require('mongoose');
const User = require('./user');
const Guild = require('./guild_setting');
const fs = require('fs');
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

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
mongoose.connect(config.db_connection, err => {
    if(err) throw err;
    console.log("Database connected");
});

client.on('ready', () => {console.log(`Logged in as ${client.user.tag}!`);});

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
    var id = member.user.id
    User.GuildUser.findOne({discord_id : id}, (err, docs) => {
        if(err) throw err;
        if(!docs) User.createGuildUser(id, member.user.username);
    });
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
        tokens.map(token => {
            swear_words.map(swear_word => {
                if(token.includes(swear_word)) words++;
            });
        });
        if(words) {
            const update = { 
                $inc : { swear_usage : words },
                $set : { clean_streak : 0 },
                $addToSet : { swear_quotes : {content:sentence, date:Date.now(), usage:words} } 
            }
            User.GuildUser.findOneAndUpdate(user_query, update).then();
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
                    const infoEmbed = {
                        color: 0x0099ff,
                        title: `${msg.member.displayName}'s Swearing Profile`,
                        fields: [
                            {
                                name : 'swear usage',
                                value : result.swear_usage
                            },
                            {
                                name : 'number of messages with swearing',
                                value : result.swear_quotes.length
                            },
                            {
                                name : 'clean streak',
                                value : result.clean_streak
                            }
                        ]
                    };
                    msg.channel.send({embed : infoEmbed});
                });
                break;
            case "swear":
                const setting = args.shift();
                if(setting === 'ignore' || setting === 'censor' || setting === 'remove') {
                    Guild.changeGuildSetting(msg.guild, setting, args.shift());
                }else
                    msg.channel.send('invalid setting')
                break;
            default:
                msg.channel.send("unknown command");
        }
    }
});

client.login(config.token);