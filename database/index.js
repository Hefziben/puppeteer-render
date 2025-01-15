const { connect } = require("mongoose");

const mongoURI = process.env.MONGODB_URL;
const connectDB = async () => {
  try {
    await connect(mongoURI);
    console.log("MongoDB Connected...");
  } catch (err) {
    console.error(err);
    // Exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB;
