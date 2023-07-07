const config = require('../config/config.json');
const chalk = require("chalk");
const Discord = require('discord.js');
global.client = new Discord.Client({intents: [
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.GuildMembers,
    Discord.GatewayIntentBits.GuildMessages,
    Discord.GatewayIntentBits.GuildMessageReactions,
    Discord.GatewayIntentBits.DirectMessages,
    Discord.GatewayIntentBits.DirectMessageReactions,
    Discord.GatewayIntentBits.GuildVoiceStates,
    Discord.GatewayIntentBits.MessageContent,
]});

// Initialize database before the other files
var cmdhandler, leveling;
const database = require('./database/database.js');
database.init().then(res => {
    client.db = res;

    cmdhandler = require('./command-handler.js');
    leveling = require('./leveling.js');
});

client.once(Discord.Events.ClientReady, (user) => {
    cmdhandler.addCommandsByPath('./commands').then(() => {
        console.log(chalk.keyword('yellow')(`Successfully loaded ${client.commands.size} commands and ${client.categories.size} categories!`));

        // Rotate through custom statuses
        setInterval(() => {
            if (config.status && Array.isArray(config.status)) {
                const index = Math.floor(Math.random() * config.status.length);

                // Replace tags with their actual content
                const activity = config.status[index]
                    .replace("{users}", client.users.cache.size)
                    .replace("{guilds}", client.guilds.cache.size);

                client.user.setActivity(`${activity} | ${config.prefix}help for a list of commands!`);
            };
        }, 60000);

        // Send reboot message if required
        if (client.channels.cache.get(config.errorChannel) && config.startupNotification === true) {
            const ownerList = config.owners.map(u => ` <@${u}>`);

            client.channels.cache.get(config.errorChannel).send(`${ownerList} I rebooted!`);
        };

        console.log(chalk.keyword('green')(`I'm up and running!`));
    });
});

client.on(Discord.Events.MessageCreate, async msg => {
    if (msg.author.bot) {
        return;
    }
    
    // Ignore DMs
    if (msg.guild === null) {
        return;
    };

    if (!msg.guild.available) {
        return;
    };

    leveling(msg);

    return cmdhandler.handleCommandMsg(msg);
});


client.login(config.token);