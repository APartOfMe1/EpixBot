module.exports = {
    setPrefix(guild, prefix) {
        if (prefix.length > 5 || prefix.includes(' ')) { // Make sure the prefix isn't anything crazy
            return Promise.reject("invalidPrefix");
        };

        if (prefix === "") { // If there wasn't any prefix given, send a default message
            return Promise.reject("noPrefix");
        };

        client.db.settings.set(guild.id, prefix, "prefix"); // Set the prefix

        return Promise.resolve(prefix);
    }
};