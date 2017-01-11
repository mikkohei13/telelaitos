// lajiapi module
const url = require('url');
const parallel = require('async/parallel');
const Slimbot = require('slimbot');
const get = require('./get');
const keys = require('../keys.js');

let parameters = {};

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
		parameters.sinceDate = "2017-01-11"; // Todo automatic

		parallel({
			uploads: function(callback) {
				get.get(
			    	("/v0/warehouse/query/aggregate?aggregateBy=document.collectionId&geoJSON=false&pageSize=100&page=1&loadedLaterThan=" + parameters.sinceDate),
			  		callback
			  	);
			},
		    collections: function(callback) {
				get.get(
			    	("/v0/collections?langFallback=true&pageSize=1000"), // Currently ~360 (2017-01-11)
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

function getUploads(data) {
//	console.log(data.collections);

	let collectionsQueryObj = getCollectionsQueryObject(data.collections);
//	console.log(collectionsQueryObj);

	let plaintext = getUploadsPlaintext(data.uploads, collectionsQueryObj);
	console.log(plaintext);

//	let message = wrapToMessage(plaintext);
//	sendToTelegram(message);
}

function getVihkolatest(data) {
}

// --------------------------------------------------------------------

function getCollectionsQueryObject(data) {
	let collectionsQueryObj = {};
	for (let i = 0; i < data.results.length; i++) {
		let item = data.results[i];
		let collectionId = "http://tun.fi/" + item.id; // Add missing domain name
		collectionsQueryObj[collectionId] = item.collectionName; // Format name here
	}
	return collectionsQueryObj;
}


// Formats the object-data into a human-readable plaintext
// This is the data processing-meat!
function getUploadsPlaintext(data, collectionsQueryObj) {
	let plaintext = "";
	let suffix = " records";

	for (let i = 0; i < data.results.length; i++) {
		let item = data.results[i];
    	let collectionId = item.aggregateBy["document.collectionId"];
    	let collectionName = collectionsQueryObj[collectionId];
    	let count = item.count;

//    	console.log(i + ". " + collection + ": " + count);
    	plaintext += (i+1) + ". " + collectionName + ": " + count + suffix + "\n";
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
		  parameters.response.end("Done sending to Telegram.");
		});
	}
	else
	{
		console.log("Debug mode, did not send this to Telegram:\n" + message);
		parameters.response.end("Done debugging.");
	}
}




// --------------------------------------------------------------------

module.exports = {
	handleQuery : handleQuery
};
