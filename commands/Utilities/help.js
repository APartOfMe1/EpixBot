const Discord = require("discord.js");
const config = require("../../config/config.json");

module.exports = {
    name: 'help',
    description: 'Shows this help command',
    category: 'Utilities',
    aliases: ['helpdm'],
    usage: '`{prefix}help`, `{prefix}help <command>`, `{prefix}help -all`, or `{prefix}help -dm`',
    examples: '`{prefix}help trivia`, `{prefix}help bal',
    async execute(msg, args) {
        if (args[0]) {
            if (args[0].toLowerCase() === 'dm') {
                var helpMsg = generateMsg();

                msg.react("✅"); //React to the message to let the user know the message was successfully sent

                return msg.author.send(helpMsg.msg, {
                    embeds: [helpMsg.embed]
                });
            };

            const cmd = client.commands.get(args.join(" ").toLowerCase()) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(args.join(" ").toLowerCase())); //Find the given command in the list

            if (!cmd || (cmd.category === "Administration" && !config.owners.includes(msg.author.id))) { //Ignore the message if it doesn't include a valid command
                return msg.channel.send("That's not a command!");
            };

            var cmdEmb = new Discord.MessageEmbed()
                .setColor(config.embedColor)
                .setFooter(config.name, client.user.avatarURL())
                .setTitle(`Showing help for ${cmd.name}`)
                .addField("Description", cmd.description)
                .addField("Category", cmd.category);

            if (cmd.aliases) {
                cmdEmb.addField("Aliases", cmd.aliases.join(", "));
            };

            if (client.db.settings.get(msg.guild.id).prefix) {
                var prefix = client.db.settings.get(msg.guild.id).prefix;
            } else {
                var prefix = config.prefix;
            };

            if (cmd.usage) {
                cmdEmb.addField("Usage", cmd.usage.replace(/{prefix}/g, prefix));
            };

            if (cmd.examples) {
                cmdEmb.addField("Examples", cmd.examples.replace(/{prefix}/g, prefix));
            };

            if (cmd.cooldown) {
                cmdEmb.addField("Cooldown", `${cmd.cooldown / 1000} seconds`);
            };

            return msg.channel.send({
                embeds: [cmdEmb]
            });
        };

        var helpMsg = generateMsg();

        return msg.channel.send(helpMsg.msg, {
            embeds: [helpMsg.embed]
        });

        function generateMsg() {
            const {
                commands
            } = msg.client;

            var cmdList = new Discord.Collection(); //Create a blank list

            var emb = new Discord.MessageEmbed() //Set a new embed
                .setColor(config.embedColor)
                .setFooter(config.name, client.user.avatarURL());

            commands.forEach(command => {
                const category = cmdList.get(command.category); //Get the category of the command

                if (command.category === "Administration" && !config.owners.includes(msg.author.id)) {
                    return;
                };

                if (category) {
                    category.set(command.name, command); //If the category exists in the list, add the command
                } else {
                    cmdList.set(command.category, new Discord.Collection().set(command.name, command)); //If the category doesn't exist in the list, add both the category and command
                };
            });

            cmdList.map((category, name) => emb.addField(name, category.map(command => `\`${command.name}\``).join(", "), true)); //Add commands to the embed sorted by category

            return {
                msg: `To run a command in ${msg.guild}, use \`${config.prefix}<command>\`. For example, \`${config.prefix}ping\`\n\nYou can also use \`${config.prefix}help <command>\` for detailed command info\n`,
                embed: emb
            };
        };
    },
};