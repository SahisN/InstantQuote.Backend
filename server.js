import express from "express";
import bodyParser from "body-parser";
import session from "express-session";
import {
  sessionSecret,
  allowedConnection,
  secure,
} from "./load_vars/loadEnv.js";
import router from "./router/record.js";
import cors from "cors";
import pkg from "session-file-store";

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "localhost";
const FileStore = pkg(session);

// Middleware to parse JSON bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  bodyParser.json(),
  cors({
    origin: [allowedConnection, "http://localhost:5173"],
    credentials: true,
    methods: ["*"],
  })
);
// establish trust proxy
app.set("trust proxy", 1);

// Set cookie settings for auth
app.use(
  session({
    store: new FileStore({}),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: secure,
    }, // Set to true if using HTTPS
  })
);

// Added router for organizing routes
app.use("/", router);

// set a port to listen
app.listen(PORT, HOST, () => {
  console.log(`Server is running at http://${HOST}:${PORT}`);
});
