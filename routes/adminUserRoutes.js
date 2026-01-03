const express = require("express");
const adminAuth = require("../middleware/adminAuth");
const {
  getUsers,
  createUser,
  updateUser,
  toggleUserStatus,
  deleteUser,
} = require("../controllers/adminUserController");

const router = express.Router();

router.use(adminAuth);

// List users
router.get("/users", getUsers);

// Create user
router.post("/users", createUser);

// Update user
router.patch("/users/:id", updateUser);

// Enable / Disable
router.patch("/users/:id/toggle", toggleUserStatus);

// Soft delete
router.delete("/users/:id", deleteUser);

module.exports = router;
