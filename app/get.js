// https get module
// Todo: api -> url

const https = require('https');
//const keys = require('../keys.js');

let parameters = {};

function init(params) {
	parameters = params; // move params to module's global scope
}

function get(host, path, localCallback) {
	let options = {
		host: host,
		path: path
	}

//	console.log(options.path);

	https.get(options, function handleAPIResponseStream(apiResponse) {
		if (200 != apiResponse.statusCode) { // Stop processing on error
			handleAPIError(apiResponse.statusCode);
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
					console.log('Response could not be parsed as JSON: ' + body);
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
	if (Number.isInteger(error)) {
		let errorMessage = 'api.laji.fi error with status code ' + error;
		parameters.response.end(errorMessage);
		console.log(errorMessage);
	}
	else {
		parameters.response.end('api.laji.fi is not responding');
		console.log("api.laji.fi is not responding (check server internet connection), error message: " + error);
	}
}

module.exports = {
	https: get,
	init: init
}