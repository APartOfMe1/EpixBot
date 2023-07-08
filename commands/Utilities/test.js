module.exports = {
    name: 'test',
    description: 'Test command please ignore',
    category: 'Utilities',
    usage: '`/test`',
    slashOptions: new client.slashCommand(),
    async execute(interaction) {
        interaction.reply('Test');
    },
};