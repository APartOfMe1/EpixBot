module.exports = {
    name: 'test',
    description: 'Test command please ignore',
    category: 'Utilities',
    usage: '`{prefix}test',
    async execute(msg, args) {
        msg.channel.send('test');
    },
};