const Discord = require('discord.js');
const config = require("../../config/config.json");

module.exports = {
  name: 'kick',
  description: 'Kick a user',
  category: 'Moderation',
  usage: '`{prefix}kick @user <reason>` or `{prefix}kick <user id> <reason>`',
  examples: '`{prefix}kick @A part of me#0412 spammed messages` or `{prefix}kick 277137613775831050 broke rules`',
  async execute(msg, args) {

    if (!msg.member.hasPermission('KICK_MEMBERS')) { //Send an error if the author doesn't have permission to kick members
      return msg.reply("Sorry! You don't have permission to kick users");
    };

    let kick = msg.mentions.members.first() || msg.guild.members.cache.get(args[0]); //Get the member to kick

    let reason = args.slice(1).join(' '); //Get the kick reason

    if (!kick) { //Send an error if no valid member is provided
      return msg.reply("Please mention a valid member of this server or give an id");
    };

    if (kick.id === msg.author.id) { //Send an error if the author tries to kick themselves
      return msg.channel.send("You can't kick yourself!");
    };

    if (!kick.kickable) { //Send an error if the member isn't kickable
      return msg.reply("I can't kick this user! Do they have a higher role? Do I have kick permissions?");
    };

    if (msg.member.roles.highest === kick.roles.highest) { //Send an error if both users are at the same level in the role hierarchy
      return msg.channel.send("I can't kick this user! Are you both at the same level in the role hierarchy?");
    };

    if (msg.member.roles.highest.comparePositionTo(kick.roles.highest) < 0) { //Send an error if the member tries to kick someone with a higher role
      return msg.channel.send("I can't kick someone with a higher role than yours!");
    };

    if (!reason) { //Send an error if there was no reason provided
      reason = "No reason provided";
    };

    kick.send(`You were kicked from ${msg.guild} because: ${reason}`); //Send the member a DM explaining why they were kicked

    const embed = new Discord.MessageEmbed() //Create and send an embed
      .setColor(config.embedColor)
      .setDescription(`${kick.user.tag} has been kicked by ${msg.author.tag}`)
      .addField(`Reason`, reason);

    await kick.kick(
      reason
    ).catch(error => msg.reply(`Sorry, I couldn't kick because of: ${error}`));

    return msg.channel.send({
      embed
    });
  },
};