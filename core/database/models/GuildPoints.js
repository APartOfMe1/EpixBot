class GuildPoints extends client.Model {
    static get tableName() {
        return 'guild_points';
    }

    static get idColumn() {
        return 'id';
    }

    static async getPointsByUserGuildId(userId, guildId) {
        var model = await this.query().findOne({
            user_id: userId,
            guild_id: guildId
        });

        // Create entry if it doesn't exist
        if (!model) {
            model = await this.query().insert({
                id: genId(12),
                user_id: userId,
                guild_id: guildId,
                points: 0,
                level: 0
            });
        }

        return model;
    }
}

function genId(length) {
    // Define the character set
    const characters = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

    var final = "";

    // Create a string with the specified length
    for (let i = 0; i < length; i++) {
        final += characters[Math.floor(Math.random() * characters.length)];
    }

    return final;
}

module.exports = GuildPoints;