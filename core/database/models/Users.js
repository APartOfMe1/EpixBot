class Users extends client.Model {
    static get tableName() {
        return 'users';
    }

    static get idColumn() {
        return 'user_id';
    }

    static async getUserById(userId) {
        var user = await this.query().findById(userId);

        // Create user entry if it doesn't exist
        if (!user) {
            user = await Users.query().insert({
                user_id: userId,
                credits: 0,
                blacklisted: 0
            });
        }

        return user;
    }

    static async setCreditsById(userId, numCredits) {
        const user = await this.getUserById(userId);

        await user.$query().patch({
            credits: numCredits
        });

        return user;
    }
}

module.exports = Users;