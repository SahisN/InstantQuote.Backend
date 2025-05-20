import { Router } from "express";
import { hash, compare } from "bcrypt";
import db from "../db/dbDriver.js";
import calculatePremium from "../utils/calculatePremium.js";

const router = Router();

// simple get route
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

    console.log(user);

    if (!user) {
      return res.status(404).send("User not found!");
    }

    if (await compare(req.body.password, user.password)) {
      // if password is correct, set session
      req.session.user = user._id;
      return res.status(200).send("Login successful!");
    }

    return res.status(404).send("Invalid username or password!");

    // if user exist, check if password is correct
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).send();
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("Error logging out");
    }
    return res.status(200).send("Logout successful!");
  });
});

// api routes (Auth Required)
router.get("/user", async (req, res) => {
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
  console.log(req.body);

  if (req.session.user) {
    const nameInsured = req.body.nameInsured;
    const companyAddress = req.body.companyAddress;
    const classCode = req.body.classCode;
    const exposureAmount = req.body.exposureAmount;

    if (nameInsured && companyAddress && classCode && exposureAmount) {
      const userId = req.session.user;
      const quote = calculatePremium(exposureAmount);

      try {
        await db.collection("quotes").insertOne({
          userId,
          nameInsured,
          companyAddress,
          classCode,
          exposureAmount,
          quote,
        });
        return res.status(200).send({ calculatePremium: quote });
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
      const userId = req.session.user;
      const quotes = await db.collection("quotes").find({ userId }).toArray();
      return res.status(200).send(quotes);
    } catch (error) {
      return res.status(500).send();
    }
  }

  return res.status(404).send("Unauthorized!");
});

export default router;
