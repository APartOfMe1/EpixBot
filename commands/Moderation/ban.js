var Discord = require("discord.js");
const config = require("../../config/config.json");

module.exports = {
  name: 'ban',
  description: 'Ban a user',
  category: 'Moderation',
  usage: '`{prefix}ban @user <reason>` or `{prefix}ban <user id> <reason>`',
  examples: '`{prefix}ban @A part of me#0412 annoying` or `{prefix}ban 277137613775831050 spammed messages`',
  async execute(msg, args) {

    if (!msg.member.permissions.has(Discord.Permissions.BAN_MEMBERS)) { //Send an error if the author doesn't have permission to ban members
      return msg.reply("Sorry! You don't have permission to ban users");
    };

    let ban = msg.mentions.members.first() || msg.guild.members.cache.get(args[0]); //Get the member to ban

    let reason = args.slice(1).join(' '); //Get the ban reason

    if (!ban) { //Send an error if no valid member is provided
      return msg.reply("Please mention a valid member of this server or give an id");
    };

    if (ban.id === msg.author.id) { //Send an error if the author tries to ban themselves
      return msg.channel.send("You can't ban yourself!");
    };

    if (!ban.bannable) { //Send an error if the member isn't bannable
      return msg.reply("I can't ban this user! Do they have a higher role? Do I have ban permissions?");
    };

    if (msg.member.roles.highest === ban.roles.highest) { //Send an error if both users are at the same level in the role hierarchy
      return msg.channel.send("I can't ban this user! Are you both at the same level in the role hierarchy?");
    };

    if (msg.member.roles.highest.comparePositionTo(ban.roles.highest) < 0) { //Send an error if the member tries to ban someone with a higher role
      return msg.channel.send("I can't ban someone with a higher role than yours!");
    };

    if (!reason) { //Send an error if there was no reason provided
      reason = "No reason provided";
    };

    ban.send(`You were banned from ${msg.guild} because: ${reason}`); //Send the author a DM explaining why they were banned

    const embed = new Discord.MessageEmbed() //Create and send an embed
      .setColor(config.embedColor)
      .setDescription(`${ban.user.tag} has been banned by ${msg.author.tag}`)
      .addField(`Reason`, reason);

    await ban.ban({
      reason: reason
    }).catch(error => msg.reply(`Sorry, I couldn't ban because of: ${error}`));

    return msg.channel.send({
      embed
    });
  },
};