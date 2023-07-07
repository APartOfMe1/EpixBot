class DisabledCommands extends client.Model {
    static get tableName() {
        return 'disabled_commands';
    }

    static get idColumn() {
        return 'command';
    }
}

module.exports = {
    
}