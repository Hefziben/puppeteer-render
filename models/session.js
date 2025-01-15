const mongoose = require("mongoose");
const { Schema } = mongoose;

// Create the schema
const SessionSchema = new Schema(
  {
    agent: { type: String, required: true },
    name: { type: String, required: true },
    base64Qr: { type: String, required: false, default: '' },
  },
  { timestamps: true } // Automatically adds `createdAt` and `updatedAt` fields
);

// Create the model
const SessionModel = mongoose.model("Session", SessionSchema);

module.exports = SessionModel;
