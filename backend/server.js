require("dotenv").config();
const express = require("express");
const cors = require("cors");

const connectdb = require("./mongodb");

const coinRoute = require("./routes/coinRoute");

const app = express();

app.use(express.json());
app.use(cors());

connectdb();

app.use("/api", coinRoute);

app.listen(5000, () => {
  console.log("Server is running on port 5000");
});
