import { Router } from "express";

const router = Router();

// simple get route
router.get("/", (req, res) => {
  return res.send("Hello World!");
});

router.get("/dashboard", (req, res) => {
  if (req.session.user) {
    return res.send("Welcome to the dashboard!");
  }
  return res.status(401).send("Authorization required!");
});

export default router;
