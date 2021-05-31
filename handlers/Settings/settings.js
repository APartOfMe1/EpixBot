const config = require("../../config/config.json");
const view = require("./View/view.js");
const prefix = require("./Prefix/prefix.js");
const logs = require("./Logs/logs.js");

module.exports = {
    view: view,
    prefix: prefix,
    logs: logs,
    ensureAll(id) {
        const settings = client.db.settings.ensure(id, { //Make sure that the enmap has the default settings
            prefix: config.prefix,
            logs: "disabled"
        });

        const selfroles = client.db.selfroles.ensure(id, {
            selfroles: [],
            autorole: "Not set"
        });

        if (settings.logs === undefined) { //Set logs as disabled if not found
            client.db.settings.set(id, "disabled", "logs");
        };

        return {
            settings: settings,
            selfroles: selfroles
        };
    }
};