require("dotenv").config();
const express = require("express");
const cors = require("cors");

const connectdb = require("./mongodb");

const coinRoute = require("./routes/coinRoute");
const path = require('path');
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
