require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const mongoose = require("mongoose");
const { sendError } = require("./lib/response");

const app = express();

if (process.env.NODE_ENV !== "test") {
  if (!process.env.JWT_SECRET) {
    console.error(
      JSON.stringify({
        code: 500,
        status: "failure",
        message: "FATAL: JWT_SECRET is not defined. Server cannot start.",
      }),
    );
    process.exit(1);
  }

  if (!process.env.MONGODB_URI) {
    console.error(
      JSON.stringify({
        code: 500,
        status: "failure",
        message: "FATAL: MONGODB_URI is not defined. Server cannot start.",
      }),
    );
    process.exit(1);
  }
}

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10kb" }));

app.use("/api/auth", require("./routes/authRoute"));
app.use("/api/testimonials", require("./routes/testimonialRoute"));

app.use((err, req, res, next) => {
  console.error(err.stack);
  sendError(res, 500, "Internal server error");
});

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== "test") {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
      console.log("MongoDB connected");
      app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch((err) => {
      console.error("MongoDB connection error:", err);
      process.exit(1);
    });
}

module.exports = app;
