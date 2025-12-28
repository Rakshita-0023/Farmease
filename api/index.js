// Vercel Serverless Function Entry Point
// This wraps your Express app for Vercel deployment
const app = require('../backend/server');

module.exports = app;
