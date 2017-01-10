// https get module
// Todo: api -> url

const https = require('https');

function getDataFromAPI(options, callback) {
	https.get(options, function handleAPIResponseStream(apiResponse) {
		let body = '';

	    apiResponse.on('data', function(chunk) {
	        body += chunk;
	    });

	    apiResponse.on('end', function() {
	   		let data = JSON.parse(body);
	   		callback(data);
//	    	let responseData = lajiTelegram[parameters.requestType](data, parameters); // call a module function based on variable - no additional if/else needed!
//	    	parameters.response.end(responseData);
	    });
	})
	.on('error', handleAPIError);
}

// Gets data from api.laji.fi and decides what to do with it

function handleAPIError(error) {
	console.log("Error reading api.laji.fi (check server internet connection): " + error);
	parameters.response.writeHead(504);
	parameters.response.end('api.laji.fi is not responding (504)');
}

module.exports = {
	get: getDataFromAPI
}