module.exports = {
    name: '8ball',
    description: 'Ask the 8ball a question',
    category: 'Fun',
    usage: '/8ball <question>',
    example: '/8ball am I real?',
    slashOptions: new client.slashCommand()
        .addStringOption(option => {
            return option
                .setName('question')
                .setDescription('The question to ask')
                .setRequired(true);
        }),
    async execute(interaction) {
        // List of possible replies
		const answer = [
			'It is certain',
			'It is decidedly so',
			'Without a doubt',
			'Yes - definitely',
			'You may rely on it',
			'As I see it, yes',
			'Most likely',
			'Outlook good',
			'Yes',
			'Signs point to yes',
			'Reply hazy, try again',
			'Ask again later',
			'Better not tell you now',
			'Cannot predict now',
			'Concentrate and ask again',
			'Don\'t count on it',
			'My reply is no',
			'My sources say no',
			'Outlook not so good',
			'Very doubtful'
		];

		// Choose a random reply from the list
		return interaction.reply(answer[Math.floor(Math.random() * answer.length)]);
    },
};