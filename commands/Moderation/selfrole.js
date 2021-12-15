const Discord = require('discord.js');
const config = require("../../config/config.json");

module.exports = {
    name: 'selfrole',
    description: 'Add a role to yourself',
    aliases: ["selfroles", "iam"],
    category: 'Moderation',
    cooldown: 5000,
    async execute(msg, args) {
        client.db.selfroles.ensure(msg.guild.id, {
            selfroles: [],
            autorole: "Not set"
        });

        if (!msg.guild.me.permissions.has(Discord.Permissions.MANAGE_ROLES)) {
            return msg.channel.send("I don't have permissions to add roles to users! Please give me the \"Manage Roles\" permission and run the command again");
        }

        // Get the role
        if (args[0]) {
            var toAdd = msg.guild.roles.cache.find(i => i.name.toLowerCase() === args.slice(0).join(" ").toLowerCase()) || msg.guild.roles.cache.find(i => i.id === args[0]) || msg.mentions.roles.first();

            // Check if the given role is valid
            if (!toAdd) {
                return fail();
            }
        } else {
            return fail();
        }

        // Check if the enmap includes the given role
        if (!client.db.selfroles.includes(msg.guild.id, toAdd.id, "selfroles")) {
            return fail();
        }

        // Send an error if the member has a higher role than the bot
        if (msg.guild.me.roles.highest.comparePositionTo(msg.member.roles.highest) < 0) {
            return msg.channel.send("I can't add a role to someone higher up than me!");
        }

        // Check if the message author already has the role
        if (msg.member.roles.cache.has(toAdd.id)) {
            // If they do, remove it
            msg.member.roles.remove(toAdd.id).catch((e) => {
                return msg.channel.send(`I couldn't remove the role from you! Are you above me in the role hierarchy?`);
            });

            return msg.channel.send(`You no longer have **${toAdd.name}**`);
        } else {
            // If they don't, add it
            msg.member.roles.add(toAdd.id).catch((e) => {
                return msg.channel.send("I couldn't add the role to you! Are you above me in the role hierarchy?");
            });

            return msg.channel.send(`You now have **${toAdd.name}**!`);
        }

        function fail() {
            var getAll = client.db.selfroles.get(msg.guild.id, "selfroles");

            var roleList = [];

            try {
                // Get the list of ignored users/channels and add them to the variable
                getAll.forEach(role => {
                    roleList.push(`${msg.guild.roles.cache.get(role).name} (${role})`);
                });
            } catch (error) {
                // If there was an error, assume there aren't any roles available
                roleList.push("No selfroles available");
            }

            // If there was nothing added, push a backup message
            if (roleList.length === 0) {
                roleList.push("No selfroles available");
            }

            const failEmb = new Discord.MessageEmbed()
                .setTitle("Selfroles")
                .setColor(config.embedColor)
                .setDescription(`Use \`${config.prefix}selfrole <role>\` to add or remove a role from yourself!`)
                .addField("Available Selfroles", `\`\`\`${roleList.join("\n")}\`\`\``);

            return msg.channel.send({
                embeds: [failEmb]
            });
        }
    },
};