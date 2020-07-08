const express = require("express");
const mongoose = require("mongoose");
const config = require("./config/config");
// const cookieSession = require("cookie-session");
const cookieParser = require("cookie-parser");
const purgeTempMeetings = require("./functions/purgeTempMeetings");

// \/ CONNECTION WITH DATABASE \/
mongoose.connect(config.mongo, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Database connected");
});
// /\ CONNECTION WITH DATABASE /\

const app = express();

// Cookies
app.use(cookieParser());

// Temporary CORS deactivation. CORS will be eventually handled by a proxy in the UI sever.
app.use((req, res, next) => {
  // res.header("Content-Type", "application/json;charset=UTF-8");
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Credentials", true);
  // res.header(
  //   "Access-Control-Allow-Headers",
  //   "Origin, X-Requested-With, Content-Type, Accept"
  // );
  res.header(
    "Access-Control-Allow-Methods",
    "GET,PUT,POST,DELETE,PATCH,OPTIONS"
  );
  next();
});

// \/ ROUTES \/
const apiRouter = require("./routes/api");
app.use("/api", apiRouter);
// /\ ROUTES /\

// \/  PURGE TEMP MEETINGS \/
purgeTempMeetings();
// /\  PURGE TEMP MEETINGS /\

module.exports = app;
