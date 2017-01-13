// lajiapi module

const url = require('url');
const querystring = require('querystring');
const parallel = require('async/parallel');
const get = require('./get');
const telegram = require('./telegram');
//const keys = require('../keys.js');

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
		parameters.requestType = "getVihkolatest";

		parallel({
			latest: function(callback) {
				get.get(
					("/v0/warehouse/query/list?selected=document.createdDate%2Cdocument.documentId%2Cdocument.editors%2Cdocument.loadDate%2Cgathering.biogeographicalProvince%2Cgathering.conversions.wgs84CenterPoint.lat%2Cgathering.conversions.wgs84CenterPoint.lon%2Cgathering.country%2Cgathering.eventDate.begin%2Cgathering.eventDate.end%2Cgathering.interpretations.biogeographicalProvince%2Cgathering.interpretations.country%2Cgathering.interpretations.finnishMunicipality%2Cgathering.locality%2Cgathering.municipality%2Cgathering.notes%2Cgathering.province%2Cgathering.team%2Cunit.linkings.taxon.qname%2Cunit.linkings.taxon.scientificName%2Cunit.linkings.taxon.vernacularName&orderBy=document.documentId%20DESC&pageSize=100&page=1&collectionId=HR.1747"),
					callback
				);
			}/*,
			collections: function(callback) {
				get.get(
					("/v0/collections?lang=fi&langFallback=true&pageSize=1000"), // Currently ~360 (2017-01-11)
					callback
				);
			}
*/		},
		function(err, results) {
//			console.log(results); // ABBA: 
			getVihkolatest(results);
		});		


	}

	else if ("/uploads" == parameters.urlParts.pathname) {
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
		parameters.response.end('Page not found 404');
	}
}

// --------------------------------------------------------------------
// Process data

function getUploads(data) {
	let collectionsQueryObj = getCollectionsQueryObject(data.collections);
	let plaintext = getUploadsPlaintext(data.uploads, collectionsQueryObj);
	let message = wrapToMessage(plaintext);
	telegram.sendToTelegram(message);
}

function getVihkolatest(data) {
//	console.log(JSON.stringify(data));
//	console.log(data.latest.results[0]);

	let documentsArray = data.latest.results;

	debug(documentsArray);

	let latestDocumentId = "none";
	let unitCount = 0;

	for (let i = 0; i < documentsArray.length; i++) {
		if ("none" == latestDocumentId) {
			latestDocumentId = documentsArray[i].document.documentId; // const ?
		}

		if (documentsArray[i].document.documentId == latestDocumentId) {
			unitCount++;
		}
		else {
			break;
		}
	}

	console.log(latestDocumentId + ": " + unitCount + " units");

//	let latestDocument = data.latest.results[0];
//	let documentId = latestDocument.document.documentId;
//	console.log(documentId);
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
	return "Päivitykset Lajitietokeskuksen tietovarastoon " + parameters.sinceDate + " jälkeen: \n" + text + "\nLuvut sisältävät sekä uuden että päivitetyt havainnot.";
}

// --------------------------------------------------------------------
// Helpers

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
	if ("true" == parameters.queryParts.telegram) {
		parameters.productionMode = true;
	}
	else {
		parameters.productionMode = false;
	}
}

function debug(data) {
	parameters.productionMode = false;
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
