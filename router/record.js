import { Router } from "express";
import { hash, compare } from "bcrypt";
import db from "../db/dbDriver.js";
import {
  calculatePremium,
  formatToCurrency,
  getFormatedDateStamp,
} from "../utils/utils.js";

import { ObjectId } from "mongodb";
import { ALLOWED_STATUSES } from "../constants/index.js";

const router = Router();

// simple get route, used for testing if endpoint is functioning correctly
router.get("/", (req, res) => {
  return res.send("Hello World!");
});

// authentication route
router.post("/signup", async (req, res) => {
  try {
    // check if user is exist
    const existingUser = await db
      .collection("accounts")
      .findOne({ email: req.body.email });

    // if user doesn't exist, create a new user
    if (!existingUser) {
      const hashedPassword = await hash(req.body.password, 10);
      await db.collection("accounts").insertOne({
        username: req.body.username,
        email: req.body.email,
        password: hashedPassword,
      });

      res.send(201).send({ message: "User created successfully!" });
    } else {
      res.status(404).send({ message: "User already exists!" });
    }
  } catch (error) {
    res.status(500).send();
  }
});

router.post("/login", async (req, res) => {
  try {
    // check if user exist, if not, return 404
    const user = await db
      .collection("accounts")
      .findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).send("User not found!");
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
    res.status(500).send();
  }
});

// removes session and logouts user
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send({ message: "Error logging out" });
    }
    res.clearCookie("connect.sid");
    return res.status(200).send({ message: "Logout successful!" });
  });
});

// api routes (Auth Required)
// /user endpoint is used to check if user is logged in or logged out
router.get("/user", async (req, res) => {
  console.log(req.session.user);
  if (req.session.user) {
    return res
      .status(200)
      .send({ data: req.session.user, message: "User Authorized" });
  }

  return res
    .status(404)
    .send({ message: "User is not logged in. Please login" });
});

router.post("/quote", async (req, res) => {
  // check if user is logged in
  if (req.session.user) {
    const nameInsured = req.body.nameInsured;
    const companyAddress = req.body.companyAddress;
    const classCode = req.body.classCode;
    const exposureAmount = formatToCurrency(req.body.exposureAmount);

    // check if all the required data is valid
    if (nameInsured && companyAddress && classCode && exposureAmount) {
      // create date stamp & format premium
      const lastUpdated = getFormatedDateStamp();
      const userId = req.session.user;
      const premium = calculatePremium(req.body.exposureAmount);

      // add data to database
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

        // return the exact same data stored in database to frontend as response
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

// returns all generate quotes
router.get("/quotes", async (req, res) => {
  if (req.session.user) {
    try {
      // get mongo userId from session
      const userId = req.session.user;

      // using projection to get specific datas for frontend to display
      const quotes = await db.collection("quotes").find({ userId }).toArray();
      return res.status(200).send(quotes);
    } catch (error) {
      return res.status(500).send();
    }
  }

  return res.status(404).send({ message: "User Unauthorized" });
});

// returns a specific quote
router.get("/get-quote/:id", async (req, res) => {
  if (req.session.user) {
    const quoteId = req.params.id;
    const userId = req.session.user;

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

  return res.status(404).send({ message: "User Unauthorized" });
});

// updates quote information in database
router.put("/edit-quotes/:id", async (req, res) => {
  if (req.session.user) {
    const quoteId = req.params.id;
    const userId = req.session.user;
    const nameInsured = req.body.nameInsured;
    const companyAddress = req.body.companyAddress;
    const classCode = req.body.classCode;
    const exposureAmount = req.body.exposureAmount;

    // check if quoteData and quoteId is valid
    if (
      nameInsured &&
      companyAddress &&
      classCode &&
      exposureAmount &&
      quoteId
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
      return res.status(404).send({ message: "missing fields" });
    }
  }

  return res.status(404).send({ message: "User Unauthorized" });
});

// updates the status of quote
router.patch("/update-status/:id", async (req, res) => {
  if (req.session.user) {
    const quoteId = req.params.id;
    const userId = req.session.user;
    const status = req.body.status;

    if (quoteId && status) {
      try {
        await db.collection("quotes").updateOne(
          { _id: new ObjectId(quoteId), userId },
          {
            $set: {
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
      return res.status(404).send({ message: "Invalid or Missing Data" });
    }
  }

  return res.status(404).send({ message: "User Unauthorized" });
});

export default router;
