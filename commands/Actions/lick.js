const fs = require('fs');
const dir = "./assets/images/gifs/lick";

module.exports = {
    name: 'lick',
    description: 'Lick a user!',
    category: 'Actions',
    usage: '`{prefix}lick @user` or `{prefix}lick username`',
    examples: '`{prefix}lick @A part of me#0412` or `{prefix}lick A part of me`',
    async execute(msg, args) {
        let member = msg.mentions.users.first() || client.users.cache.get(args[0]) || msg.guild.members.cache.find(e => e.displayName.toLowerCase().includes(args.join(" ").toLowerCase())) || msg.guild.members.cache.find(e => e.user.username.toLowerCase().includes(args.join(" ").toLowerCase())); //Search for the member by mention, id, nickname, or username

        if (!member || !args[0]) { //Send an error if no user was found
            return msg.channel.send('I couldn\'t find that user!');
        };

        let nick = msg.guild.members.cache.get(member.id).displayName; //Get the members nickname

        let auth = msg.guild.members.cache.get(msg.author.id).displayName; //Get the nickname of the message author

        var gifArr = fs.readdirSync(dir); //Set an array of all gifs in the folder

        let gif = `${dir}/${gifArr[Math.floor(Math.random() * gifArr.length)]}`; //Choose a random image from the list and send it as an attachment

        msg.channel.send({
            content: `**${auth}** licked **${nick}**!`,
            files: [gif]
        });
    },
};