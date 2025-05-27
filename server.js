import express from "express";
import bodyParser from "body-parser";
import session from "express-session";
import { sessionSecret } from "./load_vars/loadEnv.js";
import router from "./router/record.js";
import pkg from "session-file-store";

const app = express();
const PORT = process.env.PORT || 3000;
const FileStore = pkg(session);

// Middleware to parse JSON bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// establish trust proxy
app.set("trust proxy", 1);

// Set cookie settings for auth
app.use(
  session({
    store: new FileStore({}),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: true, httpOnly: true, sameSite: "none" }, // use true & sameSite: "none" if using HTTPS
  })
);

// Added router for organizing routes
app.use("/", router);

// set a port to listen
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running`);
});
