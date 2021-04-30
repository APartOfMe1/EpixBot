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
        //Ngl I don't remember what half of this does.
        //I'm writing the comments like 2 years after the original code because I was braindead when I first wrote this
        //Just google it ig lmao
        
        const canvas = Canvas.createCanvas(252, 297); //Create a blank canvas

        const img = canvas.getContext('2d'); //Probably tells it that it's 2d lol

        const text = args.join(" "); //Get the message if available

        const user = msg.mentions.users.first(); //Get the mentioned user if available

        const member = msg.mentions.members.first(); //Get the mentioned member if available

        const background = await Canvas.loadImage('./assets/images/rip/rip.png'); //Use the rip image

        img.drawImage(background, 0, 0, canvas.width, canvas.height); //Set the image

        img.font = '30px Impact'; //Set the font

        img.rotate(0); //Rotate the image

        if (!user) { //If there was no user mentioned, use the message content
            CanvasTextWrapper(canvas, text, { //Set options for text
                strokeText: true,
                textAlign: 'center',
                verticalAlign: 'bottom',
                paddingX: '55',
                paddingY: '50',
                sizeToFill: true,
                maxFontSizeToFill: '30'
            });

            var attachment = new Discord.MessageAttachment(canvas.toBuffer(), 'rip.png'); //Set the new image as an attachment

            if (text.length > 25) { //If the text is too long, send a warning before sending the image
                const final = await msg.channel.send('Warning! All text should be no longer than about 5 words or around 25 characters. Any more than that and your text might start to overlap or shrink. \n\nCreating Image...');

                setTimeout(function () {
                    final.delete();

                    return msg.channel.send(attachment);
                }, 6000);
            } else {
                return msg.channel.send(attachment); //Send the image if the message isn't too long
            };
        } else { //If there was a mention
            const getavatar = await user.displayAvatarURL({ //Get the avatar of the mentioned user
                format: 'png',
                dynamic: true,
                size: 1024
            });

            const avatar = await Canvas.loadImage(getavatar); //Load the avatar

            var finalname = user.username; //Get the username

            if (member.displayName.length < user.username.length) { //Check if the username or nickname is longer
                var finalname = member.displayName;
            };

            img.drawImage(avatar, 88, 150, 70, 70); //Add the avatar to the image

            let imgData = img.getImageData(0, 0, img.canvas.width, img.canvas.height); //Get the image data

            let pixels = imgData.data; //Get the image data again idk

            for (var i = 0; i < pixels.length; i += 4) { //Remove color from the image

                let lightness = parseInt((pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3);

                pixels[i] = lightness;

                pixels[i + 1] = lightness;

                pixels[i + 2] = lightness;

            };

            img.putImageData(imgData, 0, 0); //Set the now-colorless image

            img.textAlign = "center"; //Center the text

            img.fillText(finalname, 125, 250); //Add the text to the image

            var attachment = new Discord.MessageAttachment(canvas.toBuffer(), 'rip.png'); //Set the new image as an aattachment

            return msg.channel.send(attachment); //Send it
        };
    },
};