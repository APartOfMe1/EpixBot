module.exports = {
    viewAll(guild) {
        try { //Get the logchannel
            var logchannel = `#${client.channels.cache.get(client.db.logchannel.get(guild.id)).name} (${client.db.logchannel.get(guild.id)})`;
        } catch (error) {
            var logchannel = "disabled";
        };

        const ignoredlist = client.db.ignore.get(guild.id); //Get the list of ignored channels/users

        const idconvert = []; //Blank variable to convert usernames from IDs

        try {
            ignoredlist.forEach(ignoreId => { //Get the list of ignored users/channels and add them to the variable
                try {
                    idconvert.push(client.users.cache.get(ignoreId).tag);
                } catch (error) { //If the result isn't a user, check to see if it's a channel
                    idconvert.push(`#${client.channels.cache.get(ignoreId).name}`);
                };
            });
        } catch (error) {
            idconvert.push("None have been ignored");
        };


        if (idconvert.length === 0) { //Check if any data was added
            idconvert.push("None have been ignored");
        };

        const getAll = client.db.selfroles.get(guild.id, "selfroles"); //Get the list of selfroles

        const roleList = [];

        try {
            getAll.forEach(role => { //Get the list of ignored users/channels and add them to the variable
                roleList.push(`${guild.roles.cache.get(role).name} (${role})`);
            });
        } catch (error) {
            roleList.push("No selfroles available");
        };

        if (roleList.length === 0) { //Check if any data was added
            roleList.push("No selfroles available");
        };

        if (guild.roles.cache.has(client.db.selfroles.get(guild.id, "autorole"))) {
            var autorole = guild.roles.cache.get(client.db.selfroles.get(guild.id, "autorole")).name;
        } else {
            var autorole = client.db.selfroles.get(guild.id, "autorole");
        };

        var disabledcommands = client.db.disabledCommands.get(guild.id); //Get the list of disabled commands

        if (!disabledcommands || disabledcommands.length === 0) { //If there aren't any disabled commands, set a backup message
            disabledcommands = "No commands have been disabled";
        };

        return Promise.resolve({
            autorole: autorole,
            logchannel: logchannel,
            ignored: idconvert,
            disabled: disabledcommands,
            selfroles: roleList
        });
    }
};