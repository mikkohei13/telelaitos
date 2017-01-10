// lajiapi module
const url = require('url');
const lajiTelegram = require('./lajitelegram');
const get = require('./get');
const keys = require('../keys.js');

let parameters = {};

// Decides what to do with the query
function handleQuery(serverRequest, serverResponse) {
	parameters.response = serverResponse; // Make this available to the whole module
	let host = 'api.laji.fi';
	lajiTelegram.init(parameters); // Todo: more elegant way to do this?

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
		get.get({
	    		host: host,
	    		path: "/v0/warehouse/query/aggregate?aggregateBy=document.collectionId&geoJSON=false&pageSize=100&page=1&loadedLaterThan=" + parameters.sinceDate + "&access_token=" + keys.lajiToken
	    	},
	  		lajiTelegram.getUploads
	  	);
	}

	else {
		console.log(serverRequest.url + " not found");
		parameters.response.writeHead(404);
		parameters.response.end('Page not found (404)');
	}
}

module.exports = {
	handleQuery : handleQuery
};

