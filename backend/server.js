import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import mongoose from "mongoose";

const PORT = process.env.PORT || 5001;

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log("MongoDB Connected");

  // Start server AFTER DB connection
  app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  });
})
.catch(err => console.log("MongoDB connection failed:", err));
