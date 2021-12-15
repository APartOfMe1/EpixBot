const Discord = require("discord.js");

module.exports = {
  name: 'prune',
  description: 'Bulk delete messages',
  aliases: ['purge'],
  category: 'Moderation',
  usage: '`{prefix}prune <number>`',
  examples: '`{prefix}prune 15`',
  async execute(msg, args) {
    if (!msg.member.permissions.has(Discord.Permissions.MANAGE_MESSAGES)) {
      return msg.reply("Sorry! You can't prune messages");
    }

    if (!msg.guild.me.permissions.has(Discord.Permissions.MANAGE_MESSAGES)) {
      return msg.author.send(`I can't delete messages! I need the \`Manage Messages\` permission`);
    }

    // Get the number of messages to delete
    const deleteCount = parseInt(args[0]);

    if (!deleteCount || deleteCount < 2 || deleteCount > 100) {
      return msg.reply("Please provide a number between 2 and 100 for the number of messages to delete");
    }

    var tries = 0;

    const fetchMsgs = async (int) => {
      try {
        tries++;

        // Get the specified number of messages
        const fetched = await msg.channel.messages.fetch({
          limit: int
        });

        return fetched;
      } catch (error) {
        // Retry a few times if there was an error
        if (tries < 3) {
          return fetchMsgs(int);
        } else {
          return false;
        }
      }
    };

    const toDelete = await fetchMsgs(deleteCount);

    if (toDelete) {
      msg.channel.bulkDelete(toDelete).catch(error => msg.reply(`Couldn't delete messages because of: ${error}`));
    } else {
      return msg.channel.send("There was an error fetching messages. Please try again later");
    }
  },
};