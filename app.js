require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const config = require("./config/config");
// const cookieSession = require("cookie-session");
// const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");

// \/ CONNECTION WITH DATABASE \/
mongoose.connect(process.env.DB_URL, {
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

// app.use(cookieParser());
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use((req, res, next) => {
  if (config.allowedOrigins.includes(req.headers.origin)) {
    res.header("Access-Control-Allow-Origin", req.headers.origin);
  }
  // else {
  //   res.header("Access-Control-Allow-Origin", "*");
  // }
  res.header("Access-Control-Allow-Credentials", true);
  res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
  res.header(
    "Access-Control-Allow-Methods",
    "GET,PUT,POST,DELETE,PATCH,OPTIONS"
  );
  res.header("Cache-Control", "no-cache, no-store, must-revalidate"); // HTTP 1.1.
  res.header("Pragma", "no-cache"); // HTTP 1.0.
  next();
});

// \/ ROUTES \/
const apiRouter = require("./routes/api");
app.use("/api", apiRouter);
// /\ ROUTES /\

module.exports = app;
