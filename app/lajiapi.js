// lajiapi module
const url = require('url');
const async = require('async');
const lajiTelegram = require('./lajitelegram');
const get = require('./get');
const keys = require('../keys.js');

let parameters = {};

// Decides what to do with the query
function handleQuery(serverRequest, serverResponse) {
	parameters.response = serverResponse; // Makes this available to the whole module
	parameters.APIhost = 'api.laji.fi';
	parameters.APItoken = keys.lajiToken;

	lajiTelegram.init(parameters); // Todo: more elegant way to do this?
	get.init(parameters);

	// Router - decides what to do based on URL
	if ("/vihkolatest" == serverRequest.url) {
	  parameters.requestType = "getVihkolatest";
	}

	else if ("/uploads" == serverRequest.url) {
		parameters.requestType = "getUploads";
		parameters.sinceDate = "2017-01-10";

		async.parallel({
			uploads: function(callback) {
				get.get(
			    	("/v0/warehouse/query/aggregate?aggregateBy=document.collectionId&geoJSON=false&pageSize=100&page=1&loadedLaterThan=" + parameters.sinceDate),
			  		callback
			  	);
			},
		    collections: function(callback) {
				get.get(
			    	("/v0/collections?langFallback=true&pageSize=2"), // 1000
			  		callback
			  	);
		    }
		},
		function(err, results) {
			console.log(results);
		//	lajiTelegram.getUploads(results);
		    // the results array will equal ['one','two'] even though
		    // the second function had a shorter timeout.
		});		
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
