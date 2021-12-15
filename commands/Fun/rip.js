var Discord = require('discord.js');
var Canvas = require('canvas');
var CanvasTextWrapper = require('canvas-text-wrapper').CanvasTextWrapper;

module.exports = {
    name: 'rip',
    description: 'Create a custom tombstone. These can have either text or a user profile',
    category: 'Fun',
    usage: '`{prefix}rip <text>` or `{prefix}rip @user`',
    examples: '`{prefix}rip the code` or `{prefix}rip @A part of me#0412`',
    async execute(msg, args) {
        const canvas = Canvas.createCanvas(252, 297);

        const img = canvas.getContext('2d');

        const text = args.join(" ");

        const user = msg.mentions.users.first();

        const member = msg.mentions.members.first();

        const background = await Canvas.loadImage('./assets/images/rip/rip.png');

        img.drawImage(background, 0, 0, canvas.width, canvas.height);

        img.font = '30px Impact';

        img.rotate(0);

        // If there was no user mentioned, use the message content
        if (!user) {
            // Set options for text
            CanvasTextWrapper(canvas, text, {
                strokeText: true,
                textAlign: 'center',
                verticalAlign: 'bottom',
                paddingX: '55',
                paddingY: '50',
                sizeToFill: true,
                maxFontSizeToFill: '30'
            });

            // Set the new image as an attachment
            var attachment = new Discord.MessageAttachment(canvas.toBuffer(), 'rip.png');

            // If the text is too long, send a warning before sending the image
            if (text.length > 25) {
                const final = await msg.channel.send('Warning! All text should be no longer than about 5 words or around 25 characters. Any more than that and your text might start to overlap or shrink. \n\nCreating Image...');

                setTimeout(function () {
                    final.delete();

                    return msg.channel.send({
                        files: [attachment]
                    });
                }, 6000);
            } else {
                // Send the image if the message isn't too long
                return msg.channel.send({
                    files: [attachment]
                });
            }
        } else {
            // Get the avatar of the mentioned user
            const getavatar = await user.displayAvatarURL({
                format: 'png',
                dynamic: true,
                size: 1024
            });

            const avatar = await Canvas.loadImage(getavatar);

            var finalname = user.username;

            // Check if the username or nickname is longer
            if (member.displayName.length < user.username.length) {
                var finalname = member.displayName;
            }

            // Add the avatar to the image at a specific coordinate
            img.drawImage(avatar, 88, 150, 70, 70);

            let imgData = img.getImageData(0, 0, img.canvas.width, img.canvas.height);

            let pixels = imgData.data;

            // Remove color from the image
            for (var i = 0; i < pixels.length; i += 4) {
                let lightness = parseInt((pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3);

                pixels[i] = lightness;

                pixels[i + 1] = lightness;

                pixels[i + 2] = lightness;
            }

            // Set the now-colorless image
            img.putImageData(imgData, 0, 0);

            img.textAlign = "center";

            // Add the text to the image
            img.fillText(finalname, 125, 250);

            // Set the new image as an attachment
            var attachment = new Discord.MessageAttachment(canvas.toBuffer(), 'rip.png');

            return msg.channel.send({
                files: [attachment]
            });
        }
    },
};