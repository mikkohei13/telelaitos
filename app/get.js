// https get module
// Todo: api -> url

const https = require('https');
//const keys = require('../keys.js');

let parameters = {};

function init(params) {
	parameters = params; // move params to module's global scope
}

function getDataFromAPI(APIpath, localCallback) {
	let options = {
		host: 'api.laji.fi',
		path: (APIpath + "&access_token=" +  process.env.LAJI_TOKEN)
	}

	console.log(options.path);

	https.get(options, function handleAPIResponseStream(apiResponse) {
		if (404 == apiResponse.statusCode) { // Stop processing on 404
			handleAPIError(404);
		}
		else {
			let body = '';

		    apiResponse.on('data', function(chunk) {
		        body += chunk;
		    });

		    apiResponse.on('end', function() {
		   		let data;
				try {
					data = JSON.parse(body);
				} catch(e) {
					console.log('Malformed request: ' + body);
				}
	//	   		console.log("body: " + body); // debug
		   		localCallback(null, data); // First argument is error
		    });
		}
	})
	.on('error', handleAPIError);
}

function handleAPIError(error) {
	parameters.response.writeHead(504);
	if (404 == error) {
		parameters.response.end('api.laji.fi endpoint not found (404)');
		console.log("api.laji.fi returns 404: " + error);
	}
	else {
		parameters.response.end('api.laji.fi is not responding (504)');
		console.log("Error reading api.laji.fi (check server internet connection): " + error);
	}
}

module.exports = {
	get: getDataFromAPI,
	init: init
}