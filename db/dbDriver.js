import { MongoClient, ServerApiVersion } from "mongodb";
import { dbAppname, dbPassword, dbUsername } from "../load_vars/loadEnv.js";

// db url
const uri = `mongodb+srv://${dbUsername}:${dbPassword}@${dbAppname.toLowerCase()}.dwel0cd.mongodb.net/?retryWrites=true&w=majority&appName=${dbAppname}`;

// creating & configuring mongo client
const client = new MongoClient(uri, {
  maxPoolSize: 5,
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let conn;

try {
  conn = await client.connect();
  console.log("Connected to MongoDB");
} catch (err) {
  console.error("Error connecting to MongoDB:", err);
}

let db = client.db("employees");

export default db;
