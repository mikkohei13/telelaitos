const Slimbot = require('slimbot');
const keys = require('../keys.js');

// lajitelegram module

let parameters = {};

function getUploads(data, params) {
	parameters = params;
//	console.log(data);

	let plaintext = formatAsPlaintext(data);
	let message = wrapToMessage(plaintext);

	sendToTelegram(message);

	return "Done getting uploads!";
}

function getVihkolatest(data, params) {
	parameters = params;

	console.log(data);
	return "Done getting Vihkolatest!";
}

// --------------------------------------------------------

// Todo: UNFAKE
// Formats the object-data into a human-readable plaintext
// This is the data processing-meat!
function formatAsPlaintext(data) {
	console.log(data);
	let plaintext = "";
	let suffix = " records";

	for (let i = 0; i < data.results.length; i++) {
		let item = data.results[i];
    	let collection = item.aggregateBy["document.collectionId"];
    	let count      = item.count;
//    	console.log(i + ". " + collection + ": " + count);
    	plaintext += (i+1) + ". " + collection + ": " + count + suffix + "\n";
    	suffix = "";
    }

	return plaintext;
}

// Todo: UNFAKE
// Wraps the text into a message, with intro & footer.
function wrapToMessage(text) {
	return "Uploads to FinBIF data warehouse since " + parameters.sinceDate + ": \n" + text + "";
}

function sendToTelegram(message) {
//	const Slimbot = require('slimbot');
	const slimbot = new Slimbot(keys.lajibotTelegramToken);

	let sendToTelegram = false; // DEBUG
	if (sendToTelegram) {
		slimbot.sendMessage('@lajifi', message).then(reply => {
		  console.log(reply);
		});
	}

	console.log("Messaged Telegram: " + message);
}

module.exports = {
	getVihkolatest : getVihkolatest,
	getUploads : getUploads
};
