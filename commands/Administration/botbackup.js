const backups = require("../../handlers/Backup/backup.js");
const emojis = require("../../assets/emojis/emojis.json");

module.exports = {
    name: 'botbackup',
    description: 'Create a backup of the bot files',
    category: 'Administration',
    async execute(msg, args) {
        const optsArr = [
            "full",
            "minimal",
            "database",
            "normal"
        ];

        if (args[0] && !optsArr.includes(args[0].toLowerCase())) {
            return msg.channel.send(`That's not a valid option! Valid options are \`${optsArr.join(", ")}\`. Leave blank for the default \`normal\``);
        };

        var opts = "normal";

        if (args[0] && optsArr.includes(args[0].toLowerCase())) {
            opts = args[0].toLowerCase();
        };

        await msg.channel.send(`${emojis.loading} Processing... This could take a few minutes`).then(loadingMsg => {
            backups.createBackup(opts).then(res => {
                if (res.size > 8388608) {
                    return loadingMsg.edit(`Done! Your backup is stored in \`${res.path}\`\n\nThe file is too large to attempt uploading. Try doing a minimal backup if you would like it sent to you`);
                };

                const code = (Math.floor(Math.random() * 10000) + 10000).toString().substring(1); //Generate a random four digit code

                const newContent = `Done! Your backup is stored in \`${res.path}\`\n\nIf you would like it DMed to you, type \`${code}\`. **(This backup contains sensitive user/bot data. Be careful!)**`;

                loadingMsg.edit(newContent);

                const filter = m => m.author.id === msg.author.id && m.content === code; //Make sure the message comes from the author and includes the code we generated earlier

                msg.channel.awaitMessages({
                    filter, 
                    max: 1,
                    time: 60000,
                    errors: ['time']
                }).then(async collected => {
                    loadingMsg.edit(`${newContent}\n\n${emojis.loading} Uploading file...`);
                    
                    await msg.author.send({
                        content: "Here's your backup. It contains the bot token and/or sensitive user data. Don't share it with anyone!",
                        files: [res.path]
                    }).then(sentMsg => {
                        return loadingMsg.edit(`${newContent}\n\n(Message sent)`);
                    });
                }).catch(e => {
                    return loadingMsg.edit(`${newContent}\n\n(No answer was given, so the code was invalidated. The backup was not affected)`); //Exit the command if no message was given
                });
            });
        });
    },
};