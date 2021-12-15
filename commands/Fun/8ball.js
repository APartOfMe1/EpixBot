module.exports = {
	name: '8ball',
	description: 'Ask the 8ball a question',
	category: 'Fun',
    usage: '`{prefix}8ball <question>`',
    examples: '`{prefix}8ball am I the best Discord bot?`',
	async execute(msg, args) {
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
			'Dont count on it',
			'My reply is no',
			'My sources say no',
			'Outlook not so good',
			'Very doubtful'
		];

		if (!args[0]) {
			return msg.channel.send("You didn't give me a question!");
		}

		// Choose a random reply from the list
		return msg.channel.send(answer[Math.floor(Math.random() * answer.length)]);
	},
};