# CzechCrunch Telegram Bot

I was missing CzechCrunch in [Telegram](http://telegram.org) and created this small bot, that posts article titles and links to Telegram channel.

## How it works

- 1 bot in Telegram ([here](https://core.telegram.org/bots) is how you create one, put API key to `.env` file)
- 1 channel in Telegram
- Bot is admin in Telegram channel

Once in a while cron runs `yarn post`. Articles are fetched from `cc.cz` and sorted. Bot then depending on saved last state determines which articles are new and posts them in Telegram channel.
