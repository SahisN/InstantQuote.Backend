import { Router } from "express";
import { hash, compare } from "bcrypt";
import db from "../db/dbDriver.js";

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
        email: req.body.email,
        password: hashedPassword,
      });

      res.send(201).send("User created successfully!");
    } else {
      res.status(404).send("User already exists!");
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
      // if password is correct, set session
      req.session.user = user._id;
      return res.status(200).send("Login successful!");
    }

    return res.status(404).send("Invalid username or password!");

    // if user exist, check if password is correct
  } catch (error) {
    res.status(500).send();
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("Logout failed!");
    }

    res.clearCookie("connect.sid");
    return res.status(200).send("Logout successful!");
  });
});

// api route
router.get("/dashboard", (req, res) => {
  if (req.session.user) {
    return res.send("Welcome to the dashboard!");
  }
  return res.status(401).send("Authorization required!");
});

export default router;
