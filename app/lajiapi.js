// lajiapi module
const url = require('url');
const https = require('https');
const lajiTelegram = require('./lajitelegram');
const keys = require('../keys.js');

let response;
let parameters = {};

// Decides what to do with the query
function handleQuery(serverRequest, serverResponse) {
	response = serverResponse; // Make this available to the whole module
	let host = 'api.laji.fi';

	// Router - decides what to do based on URL
	if ("/vihkolatest" == serverRequest.url) {
	  parameters.requestType = "getVihkolatest";
	  get({
	    host: host,
	    path: '' + keys.lajiToken
	  });
	}

	else if ("/uploads" == serverRequest.url) {
	  parameters.requestType = "getUploads";
	  parameters.sinceDate = "2017-01-10";
	  get({
	    host: host,
	    path: "/v0/warehouse/query/aggregate?aggregateBy=document.collectionId&geoJSON=false&pageSize=100&page=1&loadedLaterThan=" + parameters.sinceDate + "&access_token=" + keys.lajiToken
	  });
	}

	else {
		console.log(serverRequest.url + " not found");
		response.writeHead(404);
		response.end('Page not found (404)');
	}
}

function get(options) {
	https.get(options, handleAPIResponseStream).on('error', handleAPIError);
}

// Gets data from api.laji.fi and decides what to do with it
function handleAPIResponseStream(apiResponse) {
	let body = '';

    apiResponse.on('data', function(chunk) {
        body += chunk;
    });

    apiResponse.on('end', function() {
   		let data = JSON.parse(body);
    	let responseData = lajiTelegram[parameters.requestType](data, parameters); // call a module function based on variable - no additional if/else needed!
    	response.end(responseData);
    });
}

function handleAPIError(error) {
	console.log("Error reading api.laji.fi (check server internet connection): " + error);
	response.writeHead(504);
	response.end('api.laji.fi is not responding (504)');
}

module.exports = {
	handleQuery : handleQuery
};

