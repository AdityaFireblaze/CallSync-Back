const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const adminRoutes = require("./routes/adminRoutes");



const app = express();
connectDB();

app.use(cors());
app.use(express.json());

app.use("/api", authRoutes);
app.use("/api", uploadRoutes);
app.use("/api/admin", adminRoutes);



app.get("/", (_, res) => {
  res.json({ status: "CallSync Backend Running" });
});

app.listen(5000, () => {
  console.log("🚀 CallSync Backend running on port 5000");
});
