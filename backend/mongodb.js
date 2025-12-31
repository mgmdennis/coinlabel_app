
const mongoose = require("mongoose");

const connectdb = () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set in environment variables");
    return Promise.reject(new Error("MONGODB_URI not set"));
  }
  return mongoose
    .connect(uri)
    .then(() => console.log("DB connected"))
    .catch(console.error);
};

module.exports = connectdb;