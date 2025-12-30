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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
