const express = require("express");
const createError = require("http-errors");
const config = require("./config");
const mongoose = require("mongoose");

// \/ CONNECTION WITH DATABASE \/
mongoose.connect(config.db, {
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

// Temporary CORS deactivation. CORS will be eventually handled by a proxy in the UI sever.
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

// \/ ROUTES \/
const apiWeekRouter = require("./routes/apiWeek");
app.use("/api/week", apiWeekRouter);
// /\ ROUTES /\

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
