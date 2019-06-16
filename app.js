const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const cors = require("cors");
const errorHandler = require("errorhandler");
const mongoose = require("mongoose");

mongoose.promise = global.Promise;
mongoose.set("useCreateIndex", true);
mongoose.connect(
  "mongodb+srv://system:hello123@cluster0-flpph.mongodb.net/test?retryWrites=true",
  { useNewUrlParser: true }
);
useMongoClient: true;
//Neo4j

const isProduction = process.env.NODE_ENV === "production";
const app = express();
const PORT = process.env.PORT || 8080;
const IP = process.env.IP || process.env.OPENSHIFT_NODEJS_IP || "0.0.0.0";
// set the view engine to ejs
app.set("view engine", "ejs");

app.use(
  cors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
    optionsSuccessStatus: 204
  })
);
app.use(require("morgan")("dev"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: "LightBlog",
    cookie: { maxAge: 60000 },
    resave: false,
    saveUninitialized: false
  })
);
const passport = require("passport");
// Add models

require("./models/Users");
require("./models/Students");
require("./models/Courses");
require("./models/Parents");
require("./models/Schools");
require("./models/Class");

require("./passport")(passport);
// Add routes
app.use(require("./routes"));

//app.get("/",(req,res)=>{res.send('Hi sir')});
app.use((req, res, next) => {
  const err = new Error("Not Found");
  err.status = 404;
  next(err);
});

if (!isProduction) {
  app.use((err, req, res) => {
    res.status(err.status || 500);

    res.json({
      errors: {
        message: err.message,
        error: err
      }
    });
  });
}

app.use((err, req, res) => {
  res.status(err.status || 500);

  res.json({
    errors: {
      message: err.message,
      error: {}
    }
  });
});

const server = app.listen(PORT, () =>
  console.log(`TotoSci is running, port :${PORT}`)
);
