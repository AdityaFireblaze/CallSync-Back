// controllers/userAuthController.js
exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user || user.isDeleted) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  if (user.isDisabled) {
    return res.status(403).json({
      message: "Account disabled by admin"
    });
  }

  const ok = await user.comparePassword(password);
  if (!ok) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  // issue JWT
};
