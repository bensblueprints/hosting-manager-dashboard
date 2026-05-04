const express = require('express');
const path = require('path');

// Import Netlify function handlers
const dbOperations = require('./netlify/functions/db-operations');
const domainManagement = require('./netlify/functions/domain-management');
const manageSites = require('./netlify/functions/manage-sites');
const neonManagement = require('./netlify/functions/neon-management');
const siteManagement = require('./netlify/functions/site-management');

const app = express();
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Adapter to convert Netlify function exports to Express routes
function adapt(handlerModule) {
  return async (req, res) => {
    const event = {
      httpMethod: req.method,
      body: req.method !== 'GET' ? JSON.stringify(req.body) : null,
      headers: req.headers,
      path: req.path,
      queryStringParameters: req.query,
    };

    try {
      const result = await handlerModule.handler(event);
      res.status(result.statusCode || 200);
      if (result.headers) {
        Object.entries(result.headers).forEach(([key, value]) => {
          res.setHeader(key, value);
        });
      }
      // If body is already a string, send it directly
      if (typeof result.body === 'string') {
        res.send(result.body);
      } else {
        res.json(result.body);
      }
    } catch (error) {
      console.error('Function error:', error);
      res.status(500).json({ error: error.message });
    }
  };
}

// API routes
app.post('/api/db-operations', adapt(dbOperations));
app.post('/api/domain-management', adapt(domainManagement));
app.post('/api/manage-sites', adapt(manageSites));
app.post('/api/neon-management', adapt(neonManagement));
app.post('/api/site-management', adapt(siteManagement));

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback: serve index.html for any non-API route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Hosting Manager server running on port ${PORT}`);
});
