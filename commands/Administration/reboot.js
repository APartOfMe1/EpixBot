module.exports = {
    name: 'reboot',
    description: 'Reboot the bot',
    aliases: ['restart'],
    category: 'Administration',
    async execute(msg, args) {
        msg.channel.send("Rebooting...");

        //I looked into stuff like child processes, but
        //that really wasn't a great solution. In the end
        //I just went with this. You'll need to be using
        //pm2, nodemon, forever, etc for this to work.
        process.exit(1);
    },
};