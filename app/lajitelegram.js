const Slimbot = require('slimbot');
const keys = require('../keys.js');

// lajitelegram module

function getLatest(data) {
	console.log(data);

	let plaintext = formatAsPlaintext(data);
	let message = wrapToMessage(plaintext);

	sendToTelegram(message);

	return "Done getting latest!";
}

function getUploads(data) {
	console.log(data);
	return "Done getting uploads!";
}

// --------------------------------------------------------

// Todo: UNFAKE
// Formats the object-data into a human-readable plaintext
// This is the data processing-meat!
function formatAsPlaintext(data) {
	// if ("latest" == myOptions.type) {}
	return "FAKE DATA";
}

// Todo: UNFAKE
// Wraps the text into a message, with intro & footer.
function wrapToMessage(text) {
	return "This is " + text + ", sent to you right now.";
}

function sendToTelegram(message) {
	console.log("Started Telegram...");
//	const Slimbot = require('slimbot');
	const slimbot = new Slimbot(keys.lajibotTelegramToken);

/*
	slimbot.sendMessage('@lajifi', message).then(reply => {
	  console.log(reply);
	});
*/
}

module.exports = {
	getLatest : getLatest,
	getUploads : getUploads
};
