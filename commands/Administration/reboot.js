module.exports = {
    name: 'reboot',
    description: 'Reboot the bot',
    aliases: ['restart'],
    category: 'Administration',
    async execute(msg, args) {
        // I looked into stuff like child processes, but
        // that really wasn't a great solution. In the end
        // I just went with this. You'll need to be using
        // pm2, nodemon, forever, etc for this to work.
        msg.channel.send("Rebooting...");

        // Give the message a little time to send before exiting
        setTimeout(() => {
            process.exit(1);
        }, 500);
    },
};