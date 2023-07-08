module.exports = (msg, customFilters) => {
    // List of banned words/phrases
    const defaultFilters = [
        '@everyone',
        '@here'
    ];

    let filteredMsg = msg;

    let filter = defaultFilters;

    if (customFilters && Array.isArray(customFilters)) {
        filter = customFilters;
    };

    // Run through the message and remove words as needed
    for (let i = 0; i < filteredMsg.split(" ").length; i++) {
        for (const item of filter) {
            if (filteredMsg.includes(item)) {
                filteredMsg = filteredMsg.replace(item, "<removed>");
            }
        }
    }

    return filteredMsg;
};