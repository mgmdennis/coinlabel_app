console.log("SERVER IS ATTEMPTING TO START...");

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

const connectdb = require("./mongodb");

const coinRoute = require("./routes/coinRoute");
const fs = require('fs');

const app = express();

app.use(express.json());
app.use(cors());

connectdb();

app.use("/api", coinRoute);

// Serve React build if it exists (production / Heroku)
const clientBuildPath = path.join(__dirname, '..', 'frontend', 'build');
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  app.get('*', (req, res) => {
    // respond with index.html for any non-API route
    if (req.path.startsWith('/api')) return res.status(404).end();
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
