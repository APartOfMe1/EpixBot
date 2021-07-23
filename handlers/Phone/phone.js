const config = require("../../config/config.json");
const filter = require("../Filter/filter.js");
const EventEmitter = require('events');
const emitter = new EventEmitter();

module.exports = {
    handlePhoneMsg(msg) {
        const defaultSettings = { //Define the default settings
            prefix: config.prefix,
            logs: "disabled"
        };

        const guildConf = client.db.settings.ensure(msg.guild.id, defaultSettings); //Make sure that the enmap has the default settings

        if (client.phone.chatting.find(i => i[0].guild.id === msg.guild.id || i[1].guild.id === msg.guild.id)) { //Make sure the message is from one of the currently chatting servers
            var hangupIntent = false;

            if ([`${config.prefix}hangup`, `${guildConf.prefix}hangup`].includes(msg.content.toLowerCase())) { //Check if the user wants to hang up
                hangupIntent = true;
            };

            emitter.emit("newMsg", {
                text: `${msg.author.tag}: ${filter(msg.content)}`,
                msg: msg,
                hangup: hangupIntent
            });
        };
    },
};

module.exports.emitter = emitter;