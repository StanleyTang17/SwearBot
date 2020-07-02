const express = require('express');
const app = express();
const mongoose = require('mongoose');
const User = require('../bot/user');

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
mongoose.connect(process.env.DB_CONNECTION, err => {
    if(err) throw err;
    console.log('database connected');
});

app.use(express.static('../webpage'))

app.get('/user', async function(req, res) {
    var id = req.query.id;
    User.DiscordUser.findOne({discord_id : id}, (err, user) => {
        if(user) {
            var profile = {
                username : user.username,
                guild_user_ids : user.guild_user_ids,
                guilds : []
            };
            user.guild_user_ids.forEach(guild_user_id => {
                User.GuildUser.findById(guild_user_id, (err, guild_user) => {
                    if(guild_user) {
                        profile.guilds.push(guild_user);
                        if(profile.guilds.length === profile.guild_user_ids.length)
                            res.status(200).send(profile);
                    }
                    
                });
            });
            
        }else {
            res.status(401).send('');
        }
        
    });
});

module.exports = app;