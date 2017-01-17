// https get module

const https = require("https");

let parameters = {};

function init(params) {
	parameters = params; // move params to module's global scope
}

function get(host, path, localCallback) {
	let options = {
		host: host,
		path: path
	}

	https.get(options, function handleResponseStream(apiResponse) {
		let body = "";

		apiResponse.on("data", function(chunk) {
			body += chunk;
		});

		apiResponse.on("end", function() {
			let data;
			try {
				data = JSON.parse(body);
			} catch(e) {
				console.log("Response could not be parsed as JSON: " + body);
			}
			localCallback(null, data); // First argument is error
		});

        apiResponse.on("error", handleError);
	})
	.on("error", handleError);
}

function handleError(error) {
	parameters.response.writeHead(504);
	if (Number.isInteger(error)) {
		let errorMessage = "Third-party server error with status code " + error;
		parameters.response.end(errorMessage);
		console.log(errorMessage);
	}
	else {
		parameters.response.end("Third-party server is not responding");
		console.log("Third-party server is not responding (check server internet connection), error message: " + error);
	}
}

module.exports = {
	https: get,
	init: init
}