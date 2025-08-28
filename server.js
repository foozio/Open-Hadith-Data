const serverless = require('serverless-http');
const { server } = require('./server/index.js');

// Export the server as a serverless function for Vercel
module.exports = serverless(server, {
  binary: ['*/*'],
  request: function(request, event, context) {
    // Ensure the request path is correctly forwarded
    request.path = event.path;
    request.method = event.httpMethod;
    return request;
  }
});