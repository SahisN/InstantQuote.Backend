import { Router } from "express";
import { hash, compare } from "bcrypt";
import db from "../db/dbDriver.js";
import {
  calculatePremium,
  formatToCurrency,
  getFormatedDateStamp,
  validateEmail,
  validatePassword,
  validateUsername,
} from "../utils/utils.js";

import { ObjectId } from "mongodb";
import { ALLOWED_STATUSES } from "../constants/index.js";

const router = Router();

// simple get route, used for testing if endpoint is functioning correctly
router.get("/", (req, res) => {
  return res.send("Hello World!");
});

/**
 * Api Endpoints where authorization is not required
 * These endpoints are used for user registration, login and logout
 */

/**
 * Register a new user
 * Requires request body with the following fields:
 * {email: String, password: String, username: String}
 */
router.post("/signup", async (req, res) => {
  // check if request has body & validate email, password and username here
  if (
    req.body &&
    validateEmail(req.body.email) &&
    validatePassword(req.body.password) &&
    validateUsername(req.body.username)
  ) {
    try {
      // check if user is exist
      const existingUser = await db
        .collection("accounts")
        .findOne({ email: req.body.email.toLowerCase() });

      // if user doesn't exist, create a new user
      if (!existingUser) {
        const hashedPassword = await hash(req.body.password, 10);
        await db.collection("accounts").insertOne({
          username: req.body.username,
          email: req.body.email,
          password: hashedPassword,
        });

        return res.send(201).send({ message: "User created successfully!" });
      } else {
        return res.status(404).send({ message: "User already exists!" });
      }
    } catch (error) {
      return res.status(500).send();
    }
  }

  return res.status(404).send({
    message: "Missing fields or invalid email, password, or username.",
  });
});

/**
 * Login user & adds cookies to user session
 * Requires request body with the following fields:
 * {email: String, password: String}
 */

router.post("/login", async (req, res) => {
  // checks if request has body & validate email and password here
  if (
    req.body &&
    validateEmail(req.body.email) &&
    validatePassword(req.body.password)
  ) {
    try {
      // check if user exist, if not, return 404
      const user = await db
        .collection("accounts")
        .findOne({ email: req.body.email.toLowerCase() });

      if (!user) {
        return res.status(404).send({ message: "User not found!" });
      }

      if (await compare(req.body.password, user.password)) {
        // if password is correct, set session with mongo user id and username
        req.session.user = {
          id: user._id,
          username: user.username,
        };
        return res.status(200).send({ message: "Login successful!" });
      }

      return res.status(404).send({ message: "Invalid username or password!" });

      // if user exist, check if password is correct
    } catch (error) {
      console.error("Error during login:", error);
      return res.status(500).send();
    }
  }

  // if request body is empty or invalid email or password, return 404
  return res.status(404).send({
    message: "Missing fields or invalid email or password.",
  });
});

/**
 * Logs out the user by destroying the session and clearing the cookie
 * This endpoint does not require any request body or parameters
 */
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send({ message: "Error logging out" });
    }
    res.clearCookie("connect.sid");
    return res.status(200).send({ message: "Logout successful!" });
  });
});

/**
 *  All Api Endspoints below require authorization (user must be logged in)
 */

/**
 * Get user information such as userId and username
 * This endpoint does not require any request body or parameters
 *  Only requires user to have valid cookie session
 */
router.get("/user", async (req, res) => {
  // returns user information if user is logged in
  if (req.session.user) {
    return res
      .status(200)
      .send({ data: req.session.user, message: "User Authorized" });
  }

  return res
    .status(404)
    .send({ message: "User is not logged in. Please login" });
});

/**
 * Adds a new quote to the database with userId
 * Requires request body with the following fields:
 * {nameInsured: String, companyAddress: String, classCode: String, exposureAmount: String}
 */
router.post("/quote", async (req, res) => {
  // check if request body is empty
  if (!req.body) {
    return res.status(404).send({ message: "Request Body is Required" });
  }

  // check if user is logged in
  if (req.session.user) {
    const nameInsured = req.body.nameInsured;
    const companyAddress = req.body.companyAddress;
    const classCode = req.body.classCode;

    /**
     * since exposureAmount is convert into currency prior to checking if it's valid,
     * server needs to make sure that exposureAmount is not undefined or empty
     * returns 404 if exposureAmount is not provided
     */
    if (!req.body.exposureAmount) {
      return res.status(404).send({ message: "Exposure Amount is required" });
    }
    const exposureAmount = formatToCurrency(req.body.exposureAmount);

    // check if all the required data is valid
    if (nameInsured && companyAddress && classCode && exposureAmount) {
      // create date stamp & calculate & format premium
      const lastUpdated = getFormatedDateStamp();
      const userId = req.session.user;
      const premium = calculatePremium(req.body.exposureAmount);

      // add new quotes to database. New quote will always have status of "Quote"
      // adds userId, premium and lastUpdated to the quote
      try {
        await db.collection("quotes").insertOne({
          userId,
          lastUpdated,
          nameInsured,
          companyAddress,
          classCode,
          exposureAmount,
          premium,
          status: "Quote",
        });

        // return the data that was stored in database to frontend as response except status
        return res.status(200).send({
          lastUpdated: lastUpdated,
          nameInsured: nameInsured,
          companyAddress: companyAddress,
          classCode: classCode,
          exposureAmount: exposureAmount,
          premium: premium,
        });
      } catch (error) {
        return res.status(500).send();
      }
    }

    return res.status(404).send({ message: "Missing Information" });
  }
  return res.status(404).send({ message: "User Unauthorized" });
});

/**
 * Gets all the quotes that belongs to the user
 * This endpoint does not require any request body or parameters
 */
router.get("/quotes", async (req, res) => {
  // check if user is logged in
  if (req.session.user) {
    try {
      // get mongo userId from session
      const userId = req.session.user;

      // get all the quotes that belongs to the userId
      const quotes = await db.collection("quotes").find({ userId }).toArray();
      return res.status(200).send(quotes);
    } catch (error) {
      return res.status(500).send();
    }
  }

  return res.status(404).send({ message: "User Unauthorized" });
});

/**
 * Gets all the information of a specific quote based on UserId and quoteId
 * Requires quote ID in the request parameter
 */
router.get("/get-quote/:id", async (req, res) => {
  // check if user is logged in
  if (req.session.user) {
    const quoteId = req.params.id;
    const userId = req.session.user;

    // check if quoteId is valid
    if (ObjectId.isValid(quoteId)) {
      try {
        // using filter to get quote using quoteId that belongs to the user that userId
        const quote = await db
          .collection("quotes")
          .findOne({ _id: new ObjectId(quoteId), userId });

        return res.status(200).send(quote);
      } catch (error) {
        return res.status(500).send();
      }
    }

    return res.status(404).send({ message: "Invalid or Missing Quote ID" });
  }

  return res.status(404).send({ message: "User Unauthorized" });
});

/**
 *  Updates quote information such as nameInsured, companyAddress, classCode, exposureAmount
 *  Requires quote ID in the request parameter and data in the request body
 *  Request body should contain: {nameInsured: String, companyAddress: String, classCode: String, exposureAmounnt: String}
 */
router.put("/edit-quotes/:id", async (req, res) => {
  // check if request body
  if (!req.body) {
    return res.status(404).send({ message: "Request body are required!" });
  }

  // check if user is logged in
  if (req.session.user) {
    const quoteId = req.params.id;
    const userId = req.session.user;
    const nameInsured = req.body.nameInsured;
    const companyAddress = req.body.companyAddress;
    const classCode = req.body.classCode;
    /**
     * since exposureAmount is convert into currency prior to checking if it's valid,
     * server needs to make sure that exposureAmount is not undefined or empty
     * returns 404 if exposureAmount is not provided
     */
    if (!req.body.exposureAmount) {
      return res.status(404).send({ message: "Exposure Amount is required" });
    }
    const exposureAmount = formatToCurrency(req.body.exposureAmount);

    // check if quoteData and quoteId is valid
    if (
      nameInsured &&
      companyAddress &&
      classCode &&
      exposureAmount &&
      ObjectId.isValid(quoteId)
    ) {
      // update time and premium
      const lastUpdated = getFormatedDateStamp();
      const premium = calculatePremium(exposureAmount);

      try {
        await db.collection("quotes").updateOne(
          { _id: new ObjectId(quoteId), userId },
          {
            $set: {
              lastUpdated: lastUpdated,
              nameInsured: nameInsured,
              companyAddress: companyAddress,
              exposureAmount: exposureAmount,
              premium: premium,
            },
          }
        );
        return res.status(204).send();
      } catch (error) {
        console.log(error);
        return res.status(500).send();
      }
    } else {
      return res
        .status(404)
        .send({ message: "Invalid Data/Parameters or Missing Data" });
    }
  }

  return res.status(404).send({ message: "User Unauthorized" });
});

/**
 * Updates the status & lastUpdated of a quote
 * Allowed statuses are { stauts: "Quote"} | { status: "Accepted" } | { status: "Declined" }
 * Requires quote ID in the request parameter and status in the request body
 */
router.patch("/update-status/:id", async (req, res) => {
  // check if request body
  if (!req.body) {
    return res.status(404).send({ message: "Request body are required!" });
  }

  // checks if user is logged in
  if (req.session.user) {
    const quoteId = req.params.id;
    const userId = req.session.user;
    const status = req.body.status;
    const lastUpdated = getFormatedDateStamp();

    /**
     * check if quoteId and status is valid
     * for status to be valid, it must be either "Bind", "Issued", or "Cancelled"
     */
    if (
      quoteId &&
      ALLOWED_STATUSES.includes(status) &&
      ObjectId.isValid(quoteId)
    ) {
      // only updates the status of the quote, if the id or userId matches
      try {
        await db.collection("quotes").updateOne(
          { _id: new ObjectId(quoteId), userId },
          {
            $set: {
              lastUpdated: lastUpdated,
              status: status,
            },
          }
        );

        return res.status(204).send();
      } catch (error) {
        console.log(error);
        return res.status(500).send();
      }
    } else {
      return res
        .status(404)
        .send({ message: "Invalid Data/Parameters or Missing Data" });
    }
  }

  return res.status(404).send({ message: "User Unauthorized" });
});

export default router;
