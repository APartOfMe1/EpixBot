const config = require("../../../config/config.json");

module.exports = {
    add(msg, args) {
        if (args[2]) { // Check if a role was given
            var role = msg.guild.roles.cache.find(i => i.name.toLowerCase() === args.slice(2).join(" ").toLowerCase()) || msg.guild.roles.cache.find(i => i.id === args[2]) || msg.mentions.roles.first();

            if (!role) { // Check if the given role is valid
                return Promise.reject("I couldn't find that role! Try mentioning it or giving its ID");
            };
        } else {
            return Promise.reject(`To add a role to the list of selfroles, use \`${config.prefix}settings selfroles add <name/id/@role>\`. For example: \`${config.prefix}settings selfroles add announcement-pings\``);
        };

        if (msg.member.roles.highest.comparePositionTo(role) < 0) { // Send an error if the member has a higher role than the bot
            return Promise.reject("I can't add a role to someone higher up than me!");
        };

        client.db.selfroles.push(msg.guild.id, role.id, "selfroles"); // Add the role to the list of selfroles

        return Promise.resolve(`Alright! I've added **${role.name}** to the list of selfroles. Users can assign it to themselves by using \`${config.prefix}selfrole ${role.name}\``);
    },

    remove(msg, args) {
        if (args[2]) { // Check if a role was given
            var role = msg.guild.roles.cache.find(i => i.name.toLowerCase() === args.slice(2).join(" ").toLowerCase()) || msg.guild.roles.cache.find(i => i.id === args[2]) || msg.mentions.roles.first();

            if (!role) { // Make sure the role is valid
                return Promise.reject("I couldn't find that role! Try mentioning it or giving its ID");
            };
        } else {
            return Promise.reject(`To remove a role to the list of selfroles, use \`${config.prefix}settings selfroles remove <name/id/@role>\`. For example: \`${config.prefix}settings selfroles remove announcement-pings\``);
        };

        if (client.db.selfroles.includes(msg.guild.id, role.id, "selfroles")) { // Check if the array includes the given role
            client.db.selfroles.remove(msg.guild.id, role.id, "selfroles"); // Remove the role from the array

            return Promise.resolve(`**${role.name}** was removed from the list of selfroles`);
        } else {
            return Promise.reject(`**${role.name}** isn't a selfrole!`);
        };
    },

    ensurePerms(guild) {
        if (!guild.me.permissions.has(Discord.Permissions.SEND_MESSAGES)) { // Send an error if the bot doesn't have permissions
            return Promise.reject("I don't have permissions to add roles to users! Please give me the \"Manage Roles\" permission and run the command again");
        } else {
            return Promise.resolve();
        };
    }
};