
let port = 3000;

const lajiAPI = require('./lajiapi.js');
const http = require('http');


/*
createServer is designed to call callbeack function defined in the variable "requestHandler"
by givingh it two arguments, request and reponse objects. This is the standard way of using 
callback functions.
*/

if (process.env.PORT) {
  port = process.env.PORT;
}

const server = http.createServer(requestHandler); 
server.listen((port), startServer);


// Functions
// -----------------------------------------------------

function startServer(err) {  
  if (err) {
    return console.log('Something went wrong.', err);
  }
  console.log(`Server is listening on port ${port}`);
}

function requestHandler(request, response) {
  if ("GET" != request.method) {
    response.statusCode = 404;
  }
  else {
//    response.end('Handling data...');
    lajiAPI.handleQuery(request, response);
  }

//  logToConsole(request);
}


