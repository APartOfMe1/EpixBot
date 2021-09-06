const fs = require('fs');
const dir = "./assets/images/gifs/";
const actions = require("../../assets/images/gifs/tenses.json");

module.exports = {
    name: 'action',
    description: 'Perform an action',
    category: 'Actions',
    usage: '`{prefix}action <action> @user` or `{prefix}action <action> username`',
    examples: '`{prefix}action bite @A part of me#0412` or `{prefix}action explode A part of me`',
    async execute(msg, args) {
        const actionArr = Object.keys(actions);

        if (!args[0] || !actions[args[0].toLowerCase()]) {
            return msg.channel.send(`That's not a valid action! Here's a complete list:\n\n\`\`\`\n${actionArr.join(", ")}\`\`\``);
        };

        let member = msg.mentions.users.first() || client.users.cache.get(args[1]) || msg.guild.members.cache.find(e => e.displayName.toLowerCase().includes(args.slice(1).join(" ").toLowerCase())) || msg.guild.members.cache.find(e => e.user.username.toLowerCase().includes(args.slice(1).join(" ").toLowerCase())); //Search for the member by mention, id, nickname, or username

        if (!member || !args[0]) { //Send an error if no user was found
            return msg.channel.send('I couldn\'t find that user!');
        };

        const nick = msg.guild.members.cache.get(member.id).displayName; //Get the members nickname

        const auth = msg.guild.members.cache.get(msg.author.id).displayName; //Get the nickname of the message author

        const gifArr = fs.readdirSync(dir + args[0].toLowerCase()); //Set an array of all gifs in the folder

        const gif = `${dir}${args[0].toLowerCase()}/${gifArr[Math.floor(Math.random() * gifArr.length)]}`; //Choose a random image from the list and send it as an attachment

        msg.channel.send({
            content: `**${auth}** ${actions[args[0].toLowerCase()]} **${nick}**!`,
            files: [gif]
        });
    },
};