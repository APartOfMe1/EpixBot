module.exports = {
    name: 'say',
    description: 'Make the bot say something',
    category: 'Utilities',
    usage: '`{prefix}say <message>`',
    examples: '`{prefix}say never gonna give you up`',
    slashOptions: new client.slashCommand()
        .addStringOption(o => {
            return o.setName('message')
                .setDescription('The message to send')
                .setRequired(true);
        }),
    async execute(interaction) {
        const msg = interaction.options.getString('message');

        if (msg.includes('@everyone')) { // Give an error if a ping was included in the message
            return interaction.reply("It seems that your message included an everyone ping, therefore it couldn't be sent");
        }

        if (msg.includes('@here')) {
            return interaction.reply("It seems that your message included a here ping, therefore it couldn't be sent");
        }

        interaction.deferReply();
        interaction.deleteReply();

        return interaction.channel.send(msg);
    },
};