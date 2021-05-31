# EpixBot

The last Discord bot you'll ever need! EpixBot can do everything from reminders, to leaderboards, to music, even full games of uno! It's recommended that you use the live version of the bot instead of running it yourself. You can invite EpixBot from its [official website](https://www.epixbot.gq).

## Installation

```bash
git clone https://github.com/APartOfMe1/EpixBot
cd EpixBot
npm i
node index.js
```

An example config file can be found in `/templates/config.json`. Before the bot can run, you'll need to fill in the following fields and copy the file to the `/config` directory.

- name
- token
- prefix
- embedColor
- owners

The other fields are optional, but it's recommended to fill in everything except `geniuskey` unless using music commands, in which case a genius lyrics api key is required for lyric searching.

In order to use the bup command, you'll need [TiMidity++](https://sourceforge.net/projects/timidity/) and [FFmpeg](https://ffmpeg.org/). Be sure both are able to be used on the command line globally (on Windows this means adding them to your PATH).

To set up the soundfont with timidity, copy the Bup3.sf2 file from `/assets/soundfonts/bup` to your timidity install folder. Create a file in your timidity folder named `TIMIDITY.cfg` and set it's contents to `soundfont /path/to/timidity/Bup3.sf2` (be sure to use the absolute path). Timidity should automatically detect and use the config file.

## Adding Commands

Commands are placed in the `/commands` directory in the folder corresponding to their category. A command template file can be found in `/templates/command.js`

Both commands and categories are dynamic, and will automatically be usable and detected by the help command after a reboot. There's nothing you need to do to add a command besides putting the file in the correct location.

Alternatively, a bot administrator can use the `reload` command to search for new commands/update existing ones without needing to reboot. 

## Config.json Fields

Below is an explanation of each field in the config.json template. This is just to make it more clear what each field actually does, and which ones you'll need.

- `name`: The name of the bot
- `token`: The bot token. You can get this from the [Discord Developer Portal](https://discord.com/developers/applications/)
- `prefix`: The global bot prefix. The bot will always respond to this, regardless of any per-server settings
- `embedColor`: The default color to be used with message embeds. See the [discord.js documentation](https://discord.js.org/#/docs/main/stable/class/MessageEmbed?scrollTo=setColor) for valid colors
- `owners`: An array of bot owners by id. People listed here will have access to all administration commands, so be careful who you give this permission to!
- `startupNotification`: If set to true, the bot will ping all owners in the error channel (if specified) after a reboot
- `invite`: The bot invite link
- `supportLink`: The link to a support server/website/forum/etc
- `errorChannel`: ID of the channel that the bot should log any errors to
- `geniusKey`: Genius lyrics API key. This is needed for any command that searches lyrics
- `status`:  An array of custom statuses for the bot to loop through. A status from the list is chosen at random every 60 seconds. If included anywhere in the status, `{users}` will be replaced with the total bot user count, and `{guild}` will be replaced with the total guild count

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](https://choosealicense.com/licenses/mit/)