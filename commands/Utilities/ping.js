module.exports = {
	name: 'ping',
	description: 'Ping!',
	category: 'Utilities',
	 async execute(msg, args) {
		var ping = await msg.channel.send("Fetching ping...");
		
		ping.edit(`Pong! Heartbeat is ${client.ws.ping}ms,\nMessage Roundtrip took ${mess.createdTimestamp - msg.createdTimestamp}ms.`);
	},
};