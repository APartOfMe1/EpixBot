// Require modules up here

module.exports = {
    // Required
    name: 'some-name', // Name of the command. This should always match the file name without extensions (.js, .json, etc)
    description: 'Some description', // This is where you'll describe the command
    category: 'Utilities', // This will usually be the name of the folder the command is in. Be sure to be consistent with capitalization
    // Optional
    usage: '`{prefix}some-name <arg 1> <arg 2>`, `{prefix}some-name help`', // The command usage. {prefix} will be replaced with the bot prefix in help messages
    examples: '`{prefix}some-name test1 test2`, `{prefix}some-name help`', // Some examples of valid messages. {prefix} will be replaced with the bot prefix in help messages
    aliases: ["some-other-name", "test"], // An array of command aliases. This should always be an array even if you only have one alias
    cooldown: 2500, // Command cooldown time in ms
    allowAllUsers: false, // In commands under the Administration category, allow all users access. This will, for example, allow you to have a command that doesn't show up in the help menu
    slashOptions: new client.slashCommand(), // Options for slash commands. This must be passed a slash command builder. You can use "new client.slashCommand()" to avoid having to import the module
    slashOnly: true, // Whether the command must be initiated with an interaction. Defaults to true if slashOnly is null but slashOptions is not
    // Obviously this is required as well, I just think it looks better at the bottom
    async execute(msg, args /*, interaction*/) { // If the command is executed in response to a message, msg and args will be passed. Otherwise, interaction is passed as the sole parameter
        // Actual command code
    },
};