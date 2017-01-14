// telegram module

const Slimbot = require('slimbot');

let parameters = {};

function init(params) {
	parameters = params; // move params to module's global scope
}

function sendToTelegram(message) {
//	const Slimbot = require('slimbot');
	const slimbot = new Slimbot(process.env.TELEGRAM_LAJIBOT_TOKEN);

	if (true === parameters.productionMode) {
		slimbot.sendMessage('@lajifi', message).then(reply => {
			response(message, reply);
		});
	}
	else
	{
		response(message);
	}
}

function response(message, reply) {
	if (reply) {
		console.log(reply);
	}
	console.log("Done debugging.\n\n" + message);
	parameters.response.end("Done debugging.\n\n" + message);
}

module.exports = {
	init : init,
	sendToTelegram : sendToTelegram
};

