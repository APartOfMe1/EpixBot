# EpixBot

The last Discord bot you'll ever need! EpixBot can do everything from reminders, to leaderboards, to music, even full games of uno! It's recommended that you use the live version of the bot instead of running it yourself. You can invite EpixBot from it's [official website](https://www.epixbot.gq).

## Installation

```bash
git clone https://github.com/APartOfMe1/EpixBot
cd EpixBot
npm i
node index.js
```

An example config file can be found in `/templates/config.json`. Before the bot can run, you'll need to fill in the following fields and copy the file to the `/config` directory. The other fields are optional, but it's recommended to fill in everything except `geniuskey` unless using music commands, in which case a genius lyrics api key is required for lyric searching.

- name
- token
- prefix
- embedColor
- owners

In order to use the bup command, you'll need [TiMidity++](https://sourceforge.net/projects/timidity/) and [FFmpeg](https://ffmpeg.org/). Be sure both are able to be used on the command line from anywhere (on Windows this means adding them to your PATH).

To set up the soundfont with timidity, copy the Bup3.sf2 file from `/assets/soundfonts/bup` to your timidity install folder. Create a file in your timidity folder named `TIMIDITY.cfg` and set it's contents to `soundfont /path/to/timidity/Bup3.sf2` (be sure to use the absolute path). Timidity should automatically detect and use the config file.
## Adding commands

Commands are placed in the `/commands` directory in the folder corresponding to their category. A command template file can be found in `/templates/command.js`

Commands are dynamically added on bot startup, so there's nothing you need to do to add a command besides putting it in the correct location.

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](https://choosealicense.com/licenses/mit/)