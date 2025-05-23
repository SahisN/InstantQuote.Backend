import dotenv from "dotenv";

dotenv.config();

export const dbUsername = process.env.DB_USERNAME;
export const dbPassword = process.env.DB_PASSWORD;
export const dbAppname = process.env.DB_APPNAME;
export const sessionSecret = process.env.SESSION_SECRET;
