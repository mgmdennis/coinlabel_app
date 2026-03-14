console.log("SERVER IS ATTEMPTING TO START...");

// Guarding against the "Modeling Judgy" crashes
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION at:', promise, 'reason:', reason);
  process.exit(1);
});

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require("express");
const cors = require("cors");
const fs = require('fs');
const connectdb = require("./mongodb");

// Routes
const coinRoute = require("./routes/coinRoute");
const sketchRoute = require('./routes/sketchRoute');
const proxyRoute = require('./routes/proxyRoute');

const app = express();

// --- 1. THE "BIG BITES" FIX ---
// Increase the limit to 50mb so large Base64 strings can pass through
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- 2. THE CORS "HALL PASS" ---
app.use(cors({
  origin: 'http://localhost:3000', // Allow your React dev server
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

connectdb();

// --- 3. ROUTE MOUNTING ---
// Mounting at /api/generate-sketch makes the sub-routes like /image-proxy 
// resolve to /api/generate-sketch/image-proxy
app.use("/api", coinRoute);
app.use('/api/generate-sketch', sketchRoute); 
app.use('/api/proxy', proxyRoute);

// Serve React build if it exists (production / Heroku)
const clientBuildPath = path.join(__dirname, '..', 'frontend', 'build');
if (fs.existsSync(clientBuildPath)) {
  console.log("🛠️  Production build detected. Serving static files.");
  app.use(express.static(clientBuildPath));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).end();
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🎨 Sketch Route: http://localhost:${PORT}/api/generate-sketch`);
});