import express from "express";
import bodyParser from "body-parser";
import session from "express-session";
import { sessionSecret } from "./load_vars/loadEnv.js";

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "localhost";

// Middleware to parse JSON bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Set cookie settings for auth
app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set to true if using HTTPS
  })
);

// simple get route
app.get("/", (req, res) => {
  return res.send("Hello World!");
});

app.get("/dashboard", (req, res) => {
  if (req.session.user) {
    return res.send("Welcome to the dashboard!");
  }
  return res.status(401).send("Authorization required!");
});

// set a port to listen
app.listen(PORT, HOST, () => {
  console.log(`Server is running at http://${HOST}:${PORT}`);
});
