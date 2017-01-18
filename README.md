Node.js app to send FinBIF data to a smartphone.

FinBIF API's -> Telelaitos (Node.js) -> Telegram Bot API -> Telegram

Deploy to Heroku
----------------

Set keys to .env:

	LAJI_TOKEN=your-api.laji.fi-token
	TELEGRAM_LAJIBOT_TOKEN=your-telegram-bot-token
	CRONITOR_PING_ID=ping-id
	LATESTID_FILENAME=latestid.prod.txt

Set keys to Heroku dashboard app settings: https://dashboard.heroku.com/apps/

On development server change latestid.prod.txt to latestid.dev.txt, which won't be committed to Heroku.

Run locally:

	heroku local

Deploy to Heroku:

	git push heroku master

Tail Heroku logs:

	heroku logs --tail

Call
----

Debug, resend latest document:

	https://MY-APP-NAME.herokuapp.com/vihkolatest?telegram=0&resend=1&cronitor=0

Production, send only new document:

	https://MY-APP-NAME.herokuapp.com/vihkolatest?telegram=1&resend=0&cronitor=1

Crontab:

	*/5 * * * * wget -qO- 'myAppUrl' &> /dev/null    # Notice quotes around the url!

TODO
====

- Description
- Don't stop on cronitor error
- Latest observations with gathering date and document team

