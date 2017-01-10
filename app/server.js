// serverHelper module

/*
Testing how to pass variable (port) to the module when starting it. 
Tests did not succeed.
*/


const lajiAPI = require('./lajiapi.js');

var port;


module.exports = {
  startServer : startServer,
  requestListener : requestListener
};
