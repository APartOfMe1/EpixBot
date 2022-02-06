module.exports = (msg, customFilters) => {
    const defaultFilters = [ // The list of banned words/phrases
        "@everyone",
        "@here"
    ];

    var filteredMsg = msg;

    var filter = defaultFilters;

    if (customFilters && Array.isArray(customFilters)) {
        filter = customFilters;
    };

    for (let i = 0; i < filteredMsg.split(" ").length; i++) { // Check each word to see if it's included in the list of banned words/phrases
        for (const item of filter) {
            if (filteredMsg.includes(item)) {
                filteredMsg = filteredMsg.replace(item, "<removed>");
            };
        };
    };

    return filteredMsg;
};