// Require modules up here

module.exports = {
    // Required parameters:

    // Name of the command. This should always match the file name without extensions (.js, .json, etc)
    name: 'some-name',

    // This is where you'll describe the command's function
    description: 'Some description',

    // This will usually be the name of the folder the command is in
    // Be sure to be consistent with capitalization
    category: 'Utilities',

    // Optional parameters:

    // The command usage
    // In help messages, {prefix} will be replaced with the bot prefix or a '/' if slashOnly is false
    usage: '`{prefix}some-name <arg 1> <arg 2>`, `{prefix}some-name help`',

    // Some examples of valid messages
    // In help messages, {prefix} will be replaced with the bot prefix or a '/' if slashOnly is false
    examples: '`{prefix}some-name test1 test2`, `{prefix}some-name help`',

    // An array of command aliases. This should always be an array even if you only have one alias
    aliases: ["some-other-name", "test"],

    // Command cooldown time in ms
    cooldown: 2500,

    // In commands under the Administration category, allow all users access
    // This will, for example, allow you to have a command that doesn't show up in the help menu
    allowAllUsers: false,

    // Whether the command must be initiated with an interaction
    // Defaults to true if slashOnly is null and slashOptions is not
    slashOnly: true,

    // Options for slash commands. This must be passed a slash command builder
    // You can use "new client.slashCommand()" to avoid having to import the module
    // If not specified, the slash command name and description will default to the name and description given above
    slashOptions: new client.slashCommand(),

    // Obviously this is required as well, I just think it looks better at the bottom
    // If the command is executed in response to a message, msg and args will be passed,
    // otherwise interaction is passed as the sole parameter
    async execute(msg, args /*, interaction*/) {
        // Actual command code
    },
};