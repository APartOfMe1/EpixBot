const config = require("../../../config/config.json");

module.exports = {
    autorole(msg, args) {
            var role = msg.guild.roles.cache.find(i => i.name.toLowerCase() === args.slice(1).join(" ").toLowerCase()) || msg.guild.roles.cache.find(i => i.id === args[1]) || msg.mentions.roles.first();

            if (!role) { //Check if a valid role was given
                return Promise.reject("I couldn't find that role! Try mentioning it or giving its ID");
            };

            client.db.selfroles.set(msg.guild.id, role.id, "autorole"); //Set the autorole

            return Promise.resolve(`**${role.name}** was successfully set as the auto role! Any new members that join will automatically get the role added to them. To remove the autorole, use \`${config.prefix}settings autorole remove\``);
    },

    removeRole(guildID) {
        client.db.selfroles.set(guildID, "Not set", "autorole"); //Remove the autorole

        return Promise.resolve("The autorole has been disabled");
    },

    ensurePerms(guild) {
        if (!guild.me.hasPermission('MANAGE_ROLES')) { //Send an error if the bot doesn't have permissions
            return Promise.reject("I don't have permissions to add roles to users! Please give me the \"Manage Roles\" permission and run the command again");
        } else {
            return Promise.resolve();
        };
    }
}