const config = require("../../config/config.json");
const phoneHandler = require("../../handlers/Phone/phone.js");

module.exports = {
    name: 'phone',
    description: 'Have a conversation with users on another server',
    category: 'Fun',
    aliases: ["userphone", "call"],
    cooldown: 60000,
    async execute(msg, args) {
        // Check if a call is already going on
        if (client.phone.chatting.find(i => i.find(g => g.guild.id === msg.guild.id)) || client.phone.waiting.find(i => i.guild.id === msg.guild.id)) {
            return msg.channel.send("A call is already going on in this server!");
        }

        const searchingMsg = await msg.channel.send("Trying to find another server...");

        var serverInfo = {
            guild: msg.guild,
            channel: msg.channel.id,
            searchingMsg: searchingMsg
        };

        client.phone.waiting.push(serverInfo);

        // Delete the server info after 30 seconds
        setTimeout(() => {
            var toDelete = client.phone.waiting.indexOf(client.phone.waiting.find(i => i.guild.id === msg.guild.id));

            client.phone.waiting.splice(toDelete, 1);

            if (!client.phone.chatting.find(i => i[0].guild.id === msg.guild.id || i[1].guild.id === msg.guild.id)) {
                return searchingMsg.edit("I couldn't find another server to connect to!").catch(e => {
                    return msg.channel.send("I couldn't find another server to connect to!");
                });
            }
        }, 30000);

        // Make sure there's 2 or more servers in the queue
        while (client.phone.waiting.length > 1) {
            // Get the first 2 servers
            const first2 = client.phone.waiting.slice(0, 2);

            // Remove the first server from the client.phone.waiting list
            client.phone.waiting.splice(client.phone.waiting.indexOf(client.phone.waiting.find(i => i.guild.id === first2[0].guild.id)), 1);

            // Remove the 2nd server
            client.phone.waiting.splice(client.phone.waiting.indexOf(client.phone.waiting.find(i => i.guild.id === first2[1].guild.id)), 1);

            // Add the 2 servers to the list of currently client.phone.chatting servers
            client.phone.chatting.push(first2);

            connect(first2);
        }

        // Send success messages to both servers
        function connect(servers) {
            try {
                servers[0].searchingMsg.edit(`Server found! Connected to **${servers[1].guild.name}**. Use \`${config.prefix}hangup\` to hang up the phone`).catch(e => {
                    client.channels.cache.get(servers[0].channel).send(`Server found! Connected to **${servers[1].guild.name}**. Use \`${config.prefix}hangup\` to hang up the phone`);
                });

                servers[1].searchingMsg.edit(`Server found! Connected to **${servers[0].guild.name}**. Use \`${config.prefix}hangup\` to hang up the phone`).catch(e => {
                    client.channels.cache.get(servers[1].channel).send(`Server found! Connected to **${servers[0].guild.name}**. Use \`${config.prefix}hangup\` to hang up the phone`);
                });
            } catch (error) {
                return;
            }
        }

        if (phoneHandler.emitter.listenerCount("newMsg") < 1) {
            phoneHandler.emitter.on("newMsg", info => {
                const phoneGroup = client.phone.chatting.find(i => i[0].guild.id === info.msg.guild.id || i[1].guild.id === info.msg.guild.id);

                // Check if the user wants to hang up
                if (info.hangup === true) {
                    var server = 1;

                    // Check if it was the 2nd server that hung up
                    if (client.phone.chatting.find(i => i[1].guild.id === info.msg.guild.id)) {
                        server = 0;
                    }

                    // Send a message to the other channel
                    client.channels.cache.get(phoneGroup[server].channel).send(`The other server hung up the phone`);

                    // Send a message to the current channel
                    info.msg.channel.send("You hung up the phone");

                    // Remove the servers from the list
                    return client.phone.chatting.splice(client.phone.chatting.indexOf(phoneGroup), 1);
                }

                var serverNum = 1;

                if (phoneGroup[1].guild.id === info.msg.guild.id) {
                    serverNum = 0;
                }

                // Make sure we don't try to send a message that's over the character limit
                if (info.text.length > 2000) {
                    client.channels.cache.get(phoneGroup[serverNum].channel).send(info.text.substring(0, 1950) + "...");
                } else {
                    client.channels.cache.get(phoneGroup[serverNum].channel).send(info.text);
                }
            });
        }
    },
};