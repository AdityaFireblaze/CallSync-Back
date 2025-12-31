const express = require("express");
const { createEmployee } = require("../controllers/adminEmployeeController");

const router = express.Router();

// simple admin-key protection
router.post(
  "/employees",
  (req, res, next) => {
    const key = req.headers["x-admin-key"];
    if (!key || key !== process.env.ADMIN_KEY) {
      return res.status(401).json({ message: "Admin key required" });
    }
    next();
  },
  createEmployee
);

module.exports = router;
