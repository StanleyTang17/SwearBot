const mongoose = require('mongoose');

var discordUserSchema = new mongoose.Schema({
    discord_id : String,
    username : String,
    guild_user_ids : [mongoose.Schema.Types.ObjectId]
});

var guildUserSchema = mongoose.Schema({
    guild_id : String,
    guild_name : String,
    discord_id : String,
    name : String,
    swear_usage : Number,
    swear_quotes : [
        {
            content : String,
            date : Date,
            usage : Number
        }
    ],
    clean_streak : Number
});

module.exports = {
    DiscordUser : mongoose.model('DiscordUser', discordUserSchema),
    GuildUser : mongoose.model('GuildUser', guildUserSchema),

    createDiscordUser : (id, username, guild_user_id) => {
        var newDiscordUser;
        if(guild_user_id){
            newDiscordUser = new module.exports.DiscordUser({
                discord_id : id,
                username : username,
                guild_user_ids : [guild_user_id]
            });
        }else {
            newDiscordUser = new module.exports.DiscordUser({
                discord_id : id,
                username : username,
                guild_user_ids : []
            });
        }
        newDiscordUser.save(err => {
            if(err) throw err;
            console.log("new discord user created: " + newDiscordUser.username);
        });
    },

    createGuildUser : (id, username, g_id, g_name) => {
        const newGuildUser = new module.exports.GuildUser({
            guild_id : g_id,
            guild_name : g_name,
            discord_id : id,
            name : username,
            swear_usage : 0,
            swear_quotes : [],
            clean_streak : 0
        });
        newGuildUser.save(err => {
            if(err) throw err;
            console.log("new guild user created: " + newGuildUser.name);
        });
        const query = {discord_id : id};
        module.exports.DiscordUser.findOne(query, (err, docs) => {
            if(err) throw err;
            if(docs) {
                module.exports.DiscordUser.findOneAndUpdate(query, {
                    $addToSet : {guild_user_ids : newGuildUser.id}
                }).then();
            }else {
                module.exports.createDiscordUser(id, username, newGuildUser.id);
            }
        });
    }
};