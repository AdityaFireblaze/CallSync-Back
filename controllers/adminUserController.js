const User = require("../models/User");
const bcrypt = require("bcryptjs");

/**
 * GET /api/admin/users
 * List users with search, filter & pagination
 */
exports.getUsers = async (req, res) => {
  try {
    const {
      search = "",
      role,
      status,
      page = 1,
      limit = 10,
    } = req.query;

    const query = { isDeleted: false };

    // 🔍 Search
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // 🎭 Role filter
    if (role) query.role = role;

    // ⚡ Status filter
    if (status === "active") query.isDisabled = false;
    if (status === "disabled") query.isDisabled = true;

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      users,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("getUsers error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * POST /api/admin/users
 * Create new user
 */
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    console.log(req.body);

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email & password required" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashed,
      role: role || "user",
    });

    res.status(201).json({
      success: true,
      user: user.toJSON(),
    });
  } catch (err) {
    console.error("createUser error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * PATCH /api/admin/users/:id
 * Edit user
 */
exports.updateUser = async (req, res) => {
  try {
    const { name, role } = req.body;

    const user = await User.findById(req.params.id);
    if (!user || user.isDeleted) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name) user.name = name;
    if (role) user.role = role;

    await user.save();

    res.json({ success: true, user: user.toJSON() });
  } catch (err) {
    console.error("updateUser error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * PATCH /api/admin/users/:id/toggle
 * Enable / Disable user
 */
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.isDeleted) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isDisabled = !user.isDisabled;
    await user.save();

    res.json({
      success: true,
      message: user.isDisabled ? "User disabled" : "User enabled",
    });
  } catch (err) {
    console.error("toggleUserStatus error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * DELETE /api/admin/users/:id
 * Soft delete user
 */
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.isDeleted) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isDeleted = true;
    await user.save();

    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    console.error("deleteUser error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
