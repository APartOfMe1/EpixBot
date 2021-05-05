const Discord = require('discord.js');
const config = require("../../config/config.json");

module.exports = {
    name: 'selfrole',
    description: 'Add a role to yourself',
    aliases: ["selfroles"],
    category: 'Moderation',
    cooldown: 5000,
    async execute(msg, args) {
        client.db.selfroles.ensure(msg.guild.id, {
            selfroles: [],
            autorole: "Not set"
        });

        if (!msg.guild.me.hasPermission('MANAGE_ROLES')) { //Send an error if the bot doesn't have permissions
            return msg.channel.send("I don't have permissions to add roles to users! Please give me the \"Manage Roles\" permission and run the command again");
        };

        if (args[0]) { //Get the role
            var toAdd = msg.guild.roles.cache.find(i => i.name.toLowerCase() === args.slice(0).join(" ").toLowerCase()) || msg.guild.roles.cache.find(i => i.id === args[0]) || msg.mentions.roles.first();

            if (!toAdd) { //Check if the given role is valid
                return fail();
            };
        } else {
            return fail();
        };

        if (!client.db.selfroles.includes(msg.guild.id, toAdd.id, "selfroles")) { //Check if the enmap includes the given role
            return fail();
        };

        if (msg.guild.me.roles.highest.comparePositionTo(msg.member.roles.highest) < 0) { //Send an error if the member has a higher role than the bot
            return msg.channel.send("I can't add a role to someone higher up than me!");
        };

        if (msg.member.roles.cache.has(toAdd.id)) { //Check if the message author already has the role
            msg.member.roles.remove(toAdd.id).catch((e) => { //If they do, remove it
                return msg.channel.send(`I couldn't remove the role from you! Are you above me in the role hierarchy?`);
            });

            return msg.channel.send(`You no longer have **${toAdd.name}**`);
        } else {
            msg.member.roles.add(toAdd.id).catch((e) => { //If they don't, add it
                return msg.channel.send("I couldn't add the role to you! Are you above me in the role hierarchy?");
            });

            return msg.channel.send(`You now have **${toAdd.name}**!`);
        };

        function fail() {
            var getAll = client.db.selfroles.get(msg.guild.id, "selfroles");

            var roleList = [];

            try {
                getAll.forEach(role => { //Get the list of ignored users/channels and add them to the variable
                    roleList.push(`${msg.guild.roles.cache.get(role).name} (${role})`);
                });
            } catch (error) { //If there was an error, assume there aren't any roles available
                roleList.push("No selfroles available");
            };

            if (roleList.length === 0) { //If there was nothing added, push a backup message
                roleList.push("No selfroles available");
            };

            const failEmb = new Discord.MessageEmbed()
                .setTitle("Selfroles")
                .setColor(config.embedColor)
                .setDescription(`Use \`${config.prefix}selfrole <role>\` to add or remove a role from yourself!`)
                .addField("Available Selfroles", `\`\`\`${roleList.join("\n")}\`\`\``);

            return msg.channel.send({
                embed: failEmb
            });
        };
    },
};