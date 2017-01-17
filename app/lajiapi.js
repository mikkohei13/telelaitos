// lajiapi module

const url = require("url");
const querystring = require("querystring");
const parallel = require("async/parallel");
const fs = require("fs");

const get = require("./get");
const telegram = require("./telegram");
const cronitor = require("./cronitor");
//const keys = require("../keys.js");

let parameters = {};

// --------------------------------------------------------------------
// Routing, API queries

// Decides what to do with the query
function handleQuery(serverRequest, serverResponse) {
	parameters.response = serverResponse; // Makes this available to the whole module
	setUrlParameters(serverRequest.url);

	get.init(parameters); // More elegant way to do this?
	telegram.init(parameters); // More elegant way to do this?

//	console.log(parameters.urlParts);
//	console.log(parameters.queryParts);

	// Router - decides what to do based on URL
	if ("/vihkolatest" == parameters.urlParts.pathname) {

		cronitor.ping("run", parameters.queryParts.cronitor);
		parameters.requestType = "getVihkolatest";

		parallel({
			latest: function(callback) {
				get.https(
					"api.laji.fi",
					("/v0/warehouse/query/list?selected=document.createdDate%2Cdocument.documentId%2Cdocument.editors%2Cdocument.loadDate%2Cgathering.biogeographicalProvince%2Cgathering.conversions.wgs84CenterPoint.lat%2Cgathering.conversions.wgs84CenterPoint.lon%2Cgathering.country%2Cgathering.eventDate.begin%2Cgathering.eventDate.end%2Cgathering.gatheringId%2Cgathering.interpretations.biogeographicalProvince%2Cgathering.interpretations.country%2Cgathering.interpretations.finnishMunicipality%2Cgathering.locality%2Cgathering.municipality%2Cgathering.notes%2Cgathering.province%2Cgathering.team%2Cunit.linkings.taxon.qname%2Cunit.linkings.taxon.scientificName%2Cunit.linkings.taxon.vernacularName%2Cunit.unitId&orderBy=document.documentId%20DESC&pageSize=100&page=1&collectionId=HR.1747" + "&access_token=" +  process.env.LAJI_TOKEN),
					callback
				);
			}
		},
		function(err, results) {
			getVihkolatest(results);
		});

	}

	else if ("/uploads" == parameters.urlParts.pathname) {

//		cronitor.ping("run", parameters.queryParts.cronitor); // Hasn't yet implemented the complete command
		parameters.requestType = "getUploads";
		parameters.sinceDate = getDateYesterday();

		parallel({
			uploads: function(callback) {
				get.https(
					"api.laji.fi",
					("/v0/warehouse/query/aggregate?aggregateBy=document.collectionId&geoJSON=false&pageSize=100&page=1&loadedLaterThan=" + parameters.sinceDate + "&access_token=" +  process.env.LAJI_TOKEN),
					callback
				);
			},
			collections: function(callback) {
				get.https(
					"api.laji.fi",
					("/v0/collections?lang=fi&langFallback=true&pageSize=1000" + "&access_token=" +  process.env.LAJI_TOKEN), // Currently ~360 (2017-01-11)
					callback
				);
			}
		},
		function(err, results) {
			getUploads(results);
		});		
	}

	else {
		console.log(serverRequest.url + " not found");
		parameters.response.writeHead(404);
		parameters.response.end("Page not found 404");
	}
}

// --------------------------------------------------------------------
// Process data

function getUploads(data) {
	let collectionsQueryObj = getCollectionsQueryObject(data.collections);
	let plaintext = getUploadsPlaintext(data.uploads, collectionsQueryObj);

	let messageParts = {
		prefix: ("Päivitykset Lajitietokeskuksen tietovarastoon " + parameters.sinceDate + " jälkeen:\n"),
		text : plaintext,
		suffix: "\nLuvut sisältävät sekä uudet että päivitetyt havainnot."
	};
	let message = wrapToMessage(messageParts);

	telegram.sendToTelegram(message);
}

function getVihkolatest(data) {
//	console.log(JSON.stringify(data));
//	console.log(data.latest.results[0]);

	let documentsArray = data.latest.results;

//	debug(documentsArray);

	let latestDocumentId = "none";
	let documentsObj = {};
	let totalUnitCount = 0;
	let send = true;
	let filename = "local/vihkolatest.txt";

	// Goes through units, each of which repeats it's parent gathering and document data.
	for (let i = 0; i < documentsArray.length; i++) {
		if ("none" == latestDocumentId) {
			latestDocumentId = documentsArray[i].document.documentId; // const ?
			if (1 != parameters.queryParts.resend) {
				let previousDocumentId = fs.readFileSync(filename);
				if (previousDocumentId == latestDocumentId) {
					send = false;
					break;
				}
				else {
					fs.writeFileSync(filename, latestDocumentId);
				}
			}
		}

		if (documentsArray[i].document.documentId == latestDocumentId) {
			if (typeof documentsObj[latestDocumentId] == "undefined") {
				documentsObj[latestDocumentId] = {};
			}
			if (typeof documentsObj[latestDocumentId][documentsArray[i].gathering.gatheringId] == "undefined") {
				documentsObj[latestDocumentId][documentsArray[i].gathering.gatheringId] = {};
			}

//			debug(latestDocumentId);
			if (typeof documentsArray[i].gathering.locality !== "undefined") {
				documentsObj[latestDocumentId][documentsArray[i].gathering.gatheringId]["locality"] = documentsArray[i].gathering.locality;
			}
			else
			{
				documentsObj[latestDocumentId][documentsArray[i].gathering.gatheringId]["locality"] = "(tyhjä sijainti)";
			}
			if (typeof documentsArray[i].gathering.team !== "undefined") {
				documentsObj[latestDocumentId][documentsArray[i].gathering.gatheringId]["team"] = documentsArray[i].gathering.team.join(", ");
			}
			else
			{
				documentsObj[latestDocumentId][documentsArray[i].gathering.gatheringId]["team"] = "(tyhjä ryhmä)";
			}
			documentsObj[latestDocumentId][documentsArray[i].gathering.gatheringId]["unitCount"] = addOne(documentsObj[latestDocumentId][documentsArray[i].gathering.gatheringId]["unitCount"]); // ABBA
			totalUnitCount++;
		}
		else {
			break; // Break when first document ends
		}
	}

//	console.log(totalUnitCount);
//	debug(documentsObj);

	// TODO: better message handling

	if (send) {
		let messageParts = {
			prefix: (totalUnitCount + " uutta havista:\n"),
			text : JSON.stringify(documentsObj),
			suffix: ""
		};
		let message = wrapToMessage(messageParts);
		parameters.response.end(message);
		telegram.sendToTelegram(message);
	}
	else
	{
		parameters.response.end("No new documents, latest was " + latestDocumentId);
	}

	cronitor.ping("complete", parameters.queryParts.cronitor);
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

// --------------------------------------------------------------------
// Helpers

// Wraps the text into a message, with intro & footer.
function wrapToMessage(data) {
	let message = data.prefix + " " + data.text + " " + data.suffix;
	return message;
}

function getDateYesterday() {
	let date = new Date();
	let day = date.getDate() - 2; // -2 because of exclusive filter
	let month = date.getMonth() + 1;
	let year = date.getFullYear();
	return (year + "-" + month + "-" + day);
}

function setUrlParameters(urlString) {
	parameters.urlParts = url.parse(urlString);
	parameters.queryParts = querystring.parse(parameters.urlParts.query);
	if (1 == parameters.queryParts.telegram) {
		parameters.sendToTelegram = true;
	}
	else {
		parameters.sendToTelegram = false;
	}
	console.log(parameters.queryParts);
}

function addOne(nro) {
	if (typeof nro == "undefined") {
		nro = 1;
	}
	else {
		nro++;
	}
	return nro;
}

function debug(data) {
	parameters.sendToTelegram = false;
	console.log("************************************");
	console.log("Debug:");
	console.log(data);
	console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
	parameters.response.end("Debug");
	debugger;
}

// --------------------------------------------------------------------
// Exports

module.exports = {
	handleQuery : handleQuery
};
