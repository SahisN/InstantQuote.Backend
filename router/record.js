import { Router } from "express";
import { hash, compare } from "bcrypt";
import db from "../db/dbDriver.js";
import {
  calculatePremium,
  formatToCurrency,
  getFormatedDateStamp,
} from "../utils/utils.js";

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

      res.send(201).send("User created successfully!");
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
      return res.status(200).send("Login successful!");
    }

    return res.status(404).send("Invalid username or password!");

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
      return res.status(500).send("Error logging out");
    }
    res.clearCookie("connect.sid");
    return res.status(200).send("Logout successful!");
  });
});

// api routes (Auth Required)
// /user endpoint is used to check if user is logged in or logged out
router.get("/user", async (req, res) => {
  console.log(req.session.user);
  if (req.session.user) {
    return res
      .status(200)
      .send({ data: req.session.user, message: "Authorized" });
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
      const createdAt = getFormatedDateStamp();
      const userId = req.session.user;
      const premium = calculatePremium(req.body.exposureAmount);

      // add data to database
      try {
        await db.collection("quotes").insertOne({
          userId,
          createdAt,
          nameInsured,
          companyAddress,
          classCode,
          exposureAmount,
          premium,
        });

        // return the exact same data stored in database to frontend as response
        return res.status(200).send({
          createdAt: createdAt,
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

    return res.status(404).send("Missing information!");
  }
  return res.status(404).send("Unauthorized!");
});

// returns all generate quotes
router.get("/quotes", async (req, res) => {
  if (req.session.user) {
    try {
      // get mongo userId from session
      const userId = req.session.user;

      // using projection to get specific datas for frontend to display
      const quotes = await db
        .collection("quotes")
        .find(
          { userId },
          {
            projection: {
              createdAt: 1,
              nameInsured: 1,
              companyAddress: 1,
              classCode: 1,
              exposureAmount: 1,
              premium: 1,
              _id: 0,
            },
          }
        )
        .toArray();
      return res.status(200).send(quotes);
    } catch (error) {
      return res.status(500).send();
    }
  }

  return res.status(404).send("Unauthorized!");
});

export default router;
