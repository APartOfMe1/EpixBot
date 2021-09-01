//Load the dependencies
const config = require("../../config/config.json");
const Discord = require("discord.js");
global.client = new Discord.Client({intents: [
    Discord.Intents.FLAGS.GUILDS,
    Discord.Intents.FLAGS.GUILD_MEMBERS,
    Discord.Intents.FLAGS.GUILD_MESSAGES,
    Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS
]});
const fs = require("fs");
const path = require("path");
const startup = require("./Startup/startup.js");
const cmdhandler = require("./Command-Handler/command-handler.js");
const leveling = require("./Leveling/leveling.js");
const logging = require("./Logging/logs.js");
const phone = require("../Phone/phone.js");
const reminders = require("../Reminders/reminders.js");
var allowDbUsage = true; //Prevent database read/writes if needed
client.db = require("./Database/database.js");
client.phone = {
    waiting: [],
    chatting: []
};

client.on("ready", () => {
    startup.addCommands("./commands"); //Start the bootup process by loading available commands

    client.db.settings.set("fixstreak", false); //Disallow streak fixing by default unless specified

    const dirArr = [
        path.resolve("./assets/downloads/mp3"),
        path.resolve("./assets/downloads/midi"),
        path.resolve("./assets/downloads/midi/conversions")
    ];

    for (const dir of dirArr) { //Loop through each directory
        fs.readdir(dir, (err, files) => { //Read each file
            for (const file of files) {
                if (file.endsWith(".mid") || file.endsWith(".mp3")) { //Delete midi and mp3 files left over
                    fs.unlink(path.join(dir, file), function (err) {});
                };
            };
        });
    };

    setInterval(() => { //Increment the reminder counters
        if (allowDbUsage) {
            reminders.incCounters(5000);
        };
    }, 5000);
});

client.on('error', e => { //Send a message to the error channel when an error occurs with the client
    if (client.channels.cache.get(config.errorChannel)) {
        client.channels.cache.get(config.errorChannel).send(`There was an error with the client\n\`\`\`js\n${e}\`\`\``);
    };
});

client.on('unhandledRejection', e => {
    if (client.channels.cache.get(config.errorChannel)) {
        client.channels.cache.get(config.errorChannel).send(`There was an unhandled rejection error\n\`\`\`js\n${e}\`\`\``);
    };
});

process.on('uncaughtException', err => {
    allowDbUsage = false; //Disallow potential database reads/writes to avoid possible corruption

    const d = new Date(); //Get the date for the error file

    const path = `./handlers/Main/Error-Logs/Log_${d.getMonth() + 1}-${d.getDate()}-${d.getFullYear()}_${d.getHours()}-${d.getMinutes()}-${d.getSeconds()}.txt`; //Generate the file name

    fs.writeFile(path, `There was an uncaught exception error. The details can be found below.\n\n${err.stack}`, function (e) {});

    if (client.channels.cache.get(config.errorChannel)) {
        if (err.toString().length < 1900) { //Format message around Discord's 2000 character limit
            client.channels.cache.get(config.errorChannel).send(`There was an uncaught exception error. The full details can be seen in the included file\n\`\`\`js\n${err}\`\`\``, {
                files: [path]
            });
        } else {
            client.channels.cache.get(config.errorChannel).send("There was an uncaught exception error. The details were too large to send in a message, so they're included in the file below", {
                files: [path]
            });
        };
    };

    setTimeout(() => { //Give the message a little time to send, then exit the process
        return process.exit(1);
    }, 2500);
});

client.on("guildDelete", guild => { //Delete settings when a guild is deleted
    if (allowDbUsage) {
        client.db.deleteGuild(guild.id);
    };
});

client.on("botKick", guild => { //Delete settings when the bot is kicked from a guild
    if (allowDbUsage) {
        client.db.deleteGuild(guild.id);
    };
});

client.on("messageCreate", msg => {
    if (!allowDbUsage) {
        return;
    };

    if (msg.author.bot) { //Ignore messages sent by bots
        return;
    };

    if (msg.guild === null) { //If sent in anything other than a guild (DMs for example), return
        return;
    };

    if (!msg.guild.available) { //Check if the guild is available
        return;
    };

    // if (msg.guild.id === "264445053596991498") { //Gotta love when the Discord Bot List server breaks everything
    //     return;
    // };

    leveling.handleLvl(msg);

    phone.handlePhoneMsg(msg);

    return cmdhandler.handleCommand(msg); //Check if the command is valid and execute it
});

client.on("messageUpdate", (oldmsg, newmsg) => {
    if (allowDbUsage) {
        cmdhandler.handleCommand(newmsg);

        return logging.edited(oldmsg, newmsg);
    };
});

client.on("messageDelete", delmsg => {
    if (allowDbUsage) {
        return logging.deleted(delmsg);
    };
});

client.on("guildMemberRemove", oldmember => {
    if (oldmember.user.bot) {
        return;
    };

    oldmember.guild.channels.cache.forEach(channel => { //Get each channel
        if (channel.type === "text" && channel.topic) { //Check if it's a text channel and has a set topic
            if (channel.topic.toLowerCase().includes("+>leave<+") || channel.topic.toLowerCase().includes("+>welcomeleave<+")) { //Make sure the topic includes one of the phrases
                channel.send(`${oldmember.user.tag} just left the server...`);
            };
        };
    });

    if (allowDbUsage) {
        return logging.memberLeft(oldmember);
    };
});

client.on("guildMemberAdd", newmember => {
    newmember.guild.channels.cache.forEach(channel => { //Get each channel
        if (channel.type === "text" && channel.topic) { //check if it's a text channel and has a set topic
            if (channel.topic.toLowerCase().includes("+>welcome<+") || channel.topic.toLowerCase().includes("+>welcomeleave<+")) { //Check if the topic includes one of the phrases
                channel.send(`Welcome ${newmember} to ${newmember.guild}! You are user number **${newmember.guild.members.cache.size}**`);
            };
        };
    });

    if (allowDbUsage) {
        return logging.memberJoined(newmember);
    };
});

client.on("guildCreate", guild => {
    if (!guild.available) { //Check if the guild is available
        return;
    };

    if (!guild.me.permissions.has(Discord.Permissions.SEND_MESSAGES)) { //Make sure we can send messages at all in the server
        return;
    };

    var defaultChannel;

    if (guild.systemChannel !== null && guild.systemChannel.permissionsFor(guild.me).has("SEND_MESSAGES")) {
        defaultChannel = guild.systemChannel;
    } else {
        guild.channels.cache.forEach((channel) => {
            if (channel.type == "text" && !defaultChannel) { //Sort by text channels
                if (channel.permissionsFor(guild.me).has("SEND_MESSAGES")) { //If the bot can send messages in the channel
                    defaultChannel = channel; //Set the first available channel as the default channel
                };
            };
        });
    };

    const embed = new Discord.MessageEmbed() //Send a nice message
        .setColor(config.embedColor)
        .addField('Thank you for adding me!', `My default prefix is \`${config.prefix}\`. Use \`${config.prefix}help\` or \`${config.prefix}helpdm\` for a list of commands!`);

    return defaultChannel.send({
        embed
    });
});

client.login(config.token); //Log into Discord