const zipdir = require('zip-dir');
const fs = require("fs");

module.exports = {
    createBackup(opts) {
        return new Promise(function (resolve, reject) {
            const d = new Date();

            const path = `./handlers/Backup/Backups/Backup_${d.getMonth() + 1}-${d.getDate()}-${d.getFullYear()}_${d.getHours()}-${d.getMinutes()}-${d.getSeconds()}.zip`;

            var scanDir = "./";

            switch (opts) {
                case "full": //Only filter out the other backup files
                    opts = (path, stat) => !/\.zip$/.test(path);

                    break;

                case "minimal": //Filter out the gifs since they take up a good amount of storage
                    opts = (path, stat) => !path.includes("node_modules") && !/\.zip$/.test(path) && !/\.gif$/.test(path);

                    break;

                case "database": //We only want to get the database
                    scanDir = "./data";

                    opts = (path, stat) => !path.includes("node_modules") && !/\.zip$/.test(path);

                case "normal": //Filter out the node_modules folder because we don't need it
                    opts = (path, stat) => !path.includes("node_modules") && !/\.zip$/.test(path);

                    break;

                default: //Filter out the node_modules folder because we don't need it
                    opts = (path, stat) => !path.includes("node_modules") && !/\.zip$/.test(path);

                    break;
            };

            zipdir(scanDir, {
                filter: opts,
                saveTo: path
            }, function (err, buffer) {
                if (err) {
                    return reject(err);
                };

                const size = fs.statSync(path).size;

                return resolve({
                    path: path,
                    size: size
                });
            });
        });
    }
};