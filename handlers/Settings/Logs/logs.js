module.exports = {
    enable(msg, args) {
        if (args[2]) {
            var chnl = msg.mentions.channels.first(); //Get the mentioned channel

            if (!chnl) { //Send a message if the channel is invalid
                return Promise.reject('Please specify a channel!');
            };
        } else { //Send a message if there wasn't a channel specified
            return Promise.reject('Please specify a channel!');
        };

        client.db.settings.set(msg.guild.id, 'enabled', "logs"); //Set logs to enabled

        client.db.logchannel.set(msg.guild.id, chnl.id); //Set the logchannel

        return Promise.resolve(chnl); //Send a success message
    },

    disable(guildId) {
        if (!client.db.logchannel.has(guildId)) { //Make sure the logs aren't already disabled
            return Promise.reject('Logs are already disabled!');
        };

        client.db.settings.set(guildId, 'disabled', "logs"); //Set logs to disabled

        client.db.logchannel.delete(guildId); //Delete the logchannel

        return Promise.resolve();
    },

    ignore(msg, args) {
        if (args[2]) {
            var ignoredid = msg.mentions.channels.first() || msg.mentions.users.first(); //Get the id to ignore

            if (!ignoredid) { //Send an error if the channel/user is invalid
                return Promise.reject("Please specify a user or channel to ignore from logging");
            };
        } else { //Send an error if there weren't any channels given
            return Promise.reject("Please specify a user or channel to ignore from logging");
        };

        try { //This errors out sometimes, so I might as well just duplicate the code
            if (client.db.ignore.includes(msg.guild.id, ignoredid.id)) { //Make sure the user isn't already ignored
                return Promise.reject('That user or channel is already ignored from logging!');
            };
        } catch (error) {
            client.db.ignore.ensure(msg.guild.id, []); //Ensure that the enmap has the guild

            client.db.ignore.push(msg.guild.id, ignoredid.id); //Add the id to the enmap

            return Promise.resolve(ignoredid); //Send a success message
        };

        client.db.ignore.ensure(msg.guild.id, []); //Ensure that the enmap has the guild

        client.db.ignore.push(msg.guild.id, ignoredid.id); //Add the id to the enmap

        return Promise.resolve(ignoredid); //Send a success message
    },

    unignore(msg, args) {
        if (args[2]) {
            var ignoredid = msg.mentions.channels.first() || msg.mentions.users.first(); //get the id to ignore

            if (!ignoredid) { //Send an error if the channel/user is invalid
                return Promise.reject("Please specify a user or channel to unignore");
            };
        } else {
            return Promise.reject("Please specify a user or channel to unignore"); //Send an error if there weren't any channels given
        };

        try { //This errors out sometimes, so I might as well just duplicate the code
            if (!client.db.ignore.includes(msg.guild.id, ignoredid.id)) { //Make sure the user is actually ignored
                return Promise.reject('That user or channel isn\'t ignored from logging!');
            };
        } catch (error) {
            client.db.ignore.remove(msg.guild.id, ignoredid.id); //Remove the id from the list

            return Promise.resolve(ignoredid); //Send a success message
        };

        client.db.ignore.remove(msg.guild.id, ignoredid.id); //Remove the id from the list

        return Promise.resolve(ignoredid); //Send a success message
    }
};