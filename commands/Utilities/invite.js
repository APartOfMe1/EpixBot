const config = require("../../config/config.json");

module.exports = {
	name: 'invite',
	description: 'Invite me to your server!',
	category: 'Utilities',
	async execute(msg, args) {
		var invite = "No invite link provided! Add one in `/config/config.json`";

		var server = "";

		if (config.invite) {
			invite = `Invite me to your server! ${config.invite}`;
		}

		if (config.supportLink) {
			server = `\n\nYou can also join my support server by clicking this link: ${config.supportLink}`;
		}

		return msg.channel.send(`${invite}${server}`);
	},
};