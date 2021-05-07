const download = require('download');
const mp3Duration = require('mp3-duration');
const path = require("path");
const downloadPath = path.resolve("./assets/downloads/mp3");

module.exports = {
    downloadFromFromUrl(url) {
        return new Promise((resolve, reject) => {
            var filename = genName(16); //Generate a random filename to avoid duplicate names

            download(url, downloadPath, {
                filename: `${filename}.mp3`
            }).then(async () => {
                const fullPath = (process.platform === "win32") ? `${downloadPath}\\${filename}.mp3` : `${downloadPath}/${filename}.mp3`; //Determine the platform and which slash to use

                const duration = await mp3Duration(fullPath);

                return resolve({
                    title: url.split("/").pop().trim(),
                    url: url,
                    filePath: fullPath,
                    thumbnail: path.resolve("./assets/images/music/MP3.png"),
                    duration: Math.round(duration * 1000),
                });
            });
        });
    }
};

function genName(length) {
    const characters = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"; //Define the character set

    var final = "";

    for (let i = 0; i < length; i++) { //Create a string with the specified length
        final += characters[Math.floor(Math.random() * characters.length)];
    };

    return final;
};