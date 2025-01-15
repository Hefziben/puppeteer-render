const mongoose = require("mongoose");
const { Schema } = mongoose;

// Create the schema
const QueueSchema = new Schema(
  {
    message: { type: String, required: true },
    client: { type: String, required: true },
    from: { type: String, required: true },
    type: { type: String, default: "whatsapp" },
  },
  { timestamps: true }
);

// Create the model
const QueueModel = mongoose.model("Queue", QueueSchema);

module.exports = QueueModel;
