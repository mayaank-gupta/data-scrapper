require("dotenv").config();
var createError = require("http-errors");
var cron = require("node-cron");
var express = require("express");
const TelegramBot = require("node-telegram-bot-api");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const scanners = require("./scanners.json");
const fetchData = require("./runner");
const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: false });

var indexRouter = require("./routes/index");

var app = express();

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use("/", indexRouter);

bot.on("message", (message) => {
  // Send the message to the bot itself
  console.log(message);
  bot
    .sendMessage(botId, messageText)
    .then(() => {
      console.log("Message sent to the bot itself successfully");
    })
    .catch((error) => {
      console.error("Error sending message to the bot itself:", error);
    });
});

cron.schedule("*/2 * * * *", () => {
  console.log("Cron Executed!");
  fetchData(scanners);
});

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
