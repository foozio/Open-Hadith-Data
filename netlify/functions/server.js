const serverless = require('serverless-http');
const { server } = require('../../server/index.js');

// Export the server as a Netlify function
// Make sure to handle binary media types correctly
module.exports.handler = serverless(server, {
  binary: ['*/*'],
  request: function(request, event, context) {
    // Ensure the request path is correctly forwarded
    request.path = event.path;
    request.method = event.httpMethod;
    return request;
  }
});