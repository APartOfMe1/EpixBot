const {
    inspect
} = require("util");

module.exports = {
    name: 'eval',
    description: 'Evaluate arbitrary code',
    category: 'Administration',
    usage: '`{prefix}eval <code>`',
    examples: '`{prefix}eval 2+2`',
    async execute(msg, args) {
        if (!args[0]) {
            return msg.channel.send("You need to give me something to eval!");
        }

        var mess = await msg.channel.send("Executing code...");

        try {
            var toEval = inspect(eval(args.join(" "), {
                depth: 0
            }));

            if (toEval.includes(client.token)) {
                toEval = toEval.replace(client.token, "-snip-");
            }

            mess.edit(`**INPUT:**\n\`\`\`js\n${args.join(" ")}\`\`\`\n**OUTPUT:**\n\`\`\`js\n${toEval}\`\`\``);
        } catch (error) {
            mess.edit(`**INPUT:**\n\`\`\`js\n${args.join(" ")}\`\`\`\n**OUTPUT:**\n\`\`\`js\n${error}\`\`\``);
        }
    },
};