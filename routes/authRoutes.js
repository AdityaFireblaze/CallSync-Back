const express = require("express");
const router = express.Router();

const { validateCode } = require("../controllers/authController");

router.post("/validate-code", validateCode);

module.exports = router;
