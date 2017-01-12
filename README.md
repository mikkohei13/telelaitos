Node.js app to send FinBIF data to a smartphone.

FinBIF API's -> Telelaitos (Node.js) -> Telegram Bot API -> Telegram

Deploy to Heroku
----------------

Set keys to .env:

	LAJI_TOKEN=your-api.laji.fi-token
	TELEGRAM_LAJIBOT_TOKEN=your-telegram-bot-token

Set keys to Heroku dashboard app settings: https://dashboard.heroku.com/apps/

Run locally:

	heroku local

Deploy to Heroku:

	git push heroku master

Tail Heroku logs:

	heroku logs --tail