import express from "express";
import bodyParser from "body-parser";
import session from "express-session";
import { sessionSecret } from "./load_vars/loadEnv.js";
import router from "./router/record.js";
import cors from "cors";

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
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
    }, // Set to true if using HTTPS
  })
);

// Added router for organizing routes
app.use("/", router);

// set a port to listen
app.listen(PORT, HOST, () => {
  console.log(`Server is running at http://${HOST}:${PORT}`);
});
