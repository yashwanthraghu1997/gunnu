// server.js - Express Server Configuration for Local & Vercel Deployment
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Set EJS as template view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files middleware & Increased Payload Limit for Large Photos
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Load application routes
const indexRoutes = require('./routes/index');
const videoMemoriesRoutes = require('./routes/videoMemories');
app.use('/', videoMemoriesRoutes);
app.use('/', indexRoutes);

// 404 Fallback Route
app.use((req, res) => {
  res.status(404).redirect('/dashboard');
});

// Start Express HTTP Server locally if not running on Vercel
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`✨ Gunnu's Voice server is running gracefully at http://localhost:${PORT}`);
  });
}

// Export app for Vercel Serverless Function deployment
module.exports = app;
