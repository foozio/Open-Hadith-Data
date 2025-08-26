const serverless = require('serverless-http');
const { server } = require('../../server/index.js');

// Export the server as a Netlify function
module.exports.handler = serverless(server);