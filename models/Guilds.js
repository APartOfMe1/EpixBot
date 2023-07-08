class Guilds extends client.Model {
    static get tableName() {
        return 'guilds';
    }

    static get idColumn() {
        return 'guild_id';
    }

    static async getGuildById(guildId) {
        var guild = await this.query().findById(guildId);

        // Create guild entry if it doesn't exist
        if (!guild) {
            guild = await this.query().insert({
                guild_id: guildId,
                blacklisted: 0
            });
        }

        return guild;
    }
}

module.exports = Guilds;