// lajiapi module

const url = require('url');
const parallel = require('async/parallel');
const Slimbot = require('slimbot');
const get = require('./get');
//const keys = require('../keys.js');

let parameters = {};
parameters.productionMode = false; // true -> sends messages to Telegram

// --------------------------------------------------------------------
// Routing, API queries

// Decides what to do with the query
function handleQuery(serverRequest, serverResponse) {
	parameters.response = serverResponse; // Makes this available to the whole module
	get.init(parameters); // More elegant way to do this?

	// Router - decides what to do based on URL
	if ("/vihkolatest" == serverRequest.url) {
		parameters.requestType = "getVihkolatest";
	}

	else if ("/uploads" == serverRequest.url) {
		parameters.requestType = "getUploads";
		parameters.sinceDate = getDateYesterday();

		parallel({
			uploads: function(callback) {
				get.get(
					("/v0/warehouse/query/aggregate?aggregateBy=document.collectionId&geoJSON=false&pageSize=100&page=1&loadedLaterThan=" + parameters.sinceDate),
					callback
				);
			},
			collections: function(callback) {
				get.get(
					("/v0/collections?lang=fi&langFallback=true&pageSize=1000"), // Currently ~360 (2017-01-11)
					callback
				);
			}
		},
		function(err, results) {
//			console.log(results); // ABBA: 
			getUploads(results);
		});		
	}

	else {
		console.log(serverRequest.url + " not found");
		parameters.response.writeHead(404);
		parameters.response.end('Page not found (404)');
	}
}

// --------------------------------------------------------------------
// Process data

function getUploads(data) {
	let collectionsQueryObj = getCollectionsQueryObject(data.collections);
	let plaintext = getUploadsPlaintext(data.uploads, collectionsQueryObj);
	let message = wrapToMessage(plaintext);
	sendToTelegram(message);
}

function getVihkolatest(data) {
}

// --------------------------------------------------------------------
// Format getUploads

// Prepares collection names into an object
function getCollectionsQueryObject(data) {
	let collectionsQueryObj = {};
	for (let i = 0; i < data.results.length; i++) {
		let item = data.results[i];
		let collectionId = "http://tun.fi/" + item.id; // Add missing domain name
		collectionsQueryObj[collectionId] = item.longName;
	}
	return collectionsQueryObj;
}

// Formats the object-data into a human-readable plaintext
function getUploadsPlaintext(data, collectionsQueryObj) {
	let plaintext = "";
	let suffix = " havaintoa";

	for (let i = 0; i < data.results.length; i++) {
		let item = data.results[i];
		let collectionId = item.aggregateBy["document.collectionId"];
		let collectionName = collectionsQueryObj[collectionId];
		let count = item.count;

		plaintext += (i+1) + ". " + collectionName + ": " + count + suffix + "\n";
		suffix = "";
	}
	return plaintext;
}

// Wraps the text into a message, with intro & footer.
function wrapToMessage(text) {
	return "Päivitykset Lajitietokeskuksen tietovarastoon " + parameters.sinceDate + " alkaen: \n" + text + "";
}

// --------------------------------------------------------------------
// Telegram
// TODO: ->module

function sendToTelegram(message) {
//	const Slimbot = require('slimbot');
	const slimbot = new Slimbot(process.env.TELEGRAM_LAJIBOT_TOKEN);

	if (parameters.productionMode) {
		slimbot.sendMessage('@lajifi', message).then(reply => {
		  console.log(reply);
		  parameters.response.end("Done sending to Telegram. (" + message.length + " characters)");
		});
	}
	else
	{
		console.log("Debug mode, did not send this to Telegram:\n" + message);
		parameters.response.end("Done debugging. (" + message.length + " characters)");
	}
}

function getDateYesterday() {
	let date = new Date();
	let day = date.getDate();
	let month = date.getMonth() + 1;
	let year = date.getFullYear();
	return (year + "-" + month + "-" + day);
}

// --------------------------------------------------------------------
// Exports

module.exports = {
	handleQuery : handleQuery
};
