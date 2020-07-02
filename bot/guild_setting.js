const mongoose = require('mongoose');

var guildSettingSchema = new mongoose.Schema({
    guild_id : String,
    guild_name : String,
    ban_threshold : Number,
    channels : [{name : String, id : String, setting : String}]
});

module.exports = {
    GuildSetting : mongoose.model('GuildSetting', guildSettingSchema),

    createGuildSetting : (guild, ban_count) => {
        var channel_settings = [];
        // console.log(guild.channels.cache);
        for(const [snowflake, channel] of guild.channels.cache) {
            console.log(channel.name);
            if(channel.type === 'text')
                channel_settings.push({name: channel.name, id: channel.id, setting: 'ignore'});
        }
        var threshold = -1;
        if(ban_count) threshold = ban_count;
        var newSetting = new module.exports.GuildSetting({
            guild_id : guild.id,
            guild_name : guild.name,
            ban_threshold : threshold,
            channels : channel_settings
        });
        newSetting.save(err => {
            if(err) throw err;
            console.log(`created new settings for ${guild.name}`);
        });
    },

    changeGuildSetting : (guild, setting, channel_name) => {
        module.exports.GuildSetting.findOne({guild_id : guild.id}, (err, result) => {
            if(result) {
                var channel_settings = result.channels;
                if(channel_name) {
                    for(var i = 0; i < channel_settings.length; i++) {
                        if(channel_settings[i].name === channel_name) {
                            channel_settings[i].setting = setting;
                            module.exports.GuildSetting.findOneAndUpdate(
                                {guild_id : guild.id, 'channels.name' : channel_name},
                                {$set : {'channels.$.setting' : setting}}
                            ).then(() => {console.log(`updated settings for ${channel_name} in ${guild.name}`)});
                            break;
                        }
                    }
                } else {
                    channel_settings.forEach(channel_setting => {channel_setting.setting = setting;});
                    module.exports.GuildSetting.findOneAndUpdate(
                        {guild_id : guild.id},
                        {$set : {channels : channel_settings}}
                    ).then(() => {console.log(`updated settings for ${channel.name} in ${guild.name}`)});
                }
            }
        });
    },

    refreshGuildSetting : (guild, prev_setting) => {
        channel_settings = prev_setting.channels;
        for(const [snowflake, channel] of guild.channels.cache) {
            if(!channel_settings.find(id => id === channel.id))
                channel_settings.push({name : channel.name, id : channel.id, setting : 'ignore'});
        }
        module.exports.GuildSetting.findOneAndUpdate(
            {guild_id : guild.id},
            {$set : {channels : channel_settings}}
        ).then(() => {console.log(`refreshed settings for ${guild.name}`);});
    },

    setBanThreshold : (guild, count) => {
        module.exports.GuildSetting.findOneAndUpdate(
            {guild_id : guild.id},
            {$set : {ban_threshold : count} }
        ).then(() => {console.log(`updated threshold for ${guild.name}`);});
    }
}