const { connect } = require("mongoose");

const mongoURI = process.env.MONGODB_URL;
console.log("MongoDB Connected...", mongoURI);
const connectDB = async () => {
  try {
    await connect(mongoURI);
    console.log("MongoDB Connected...");
  } catch (err) {
    console.error(err);
    console.log("MongoDB err...", err);
    process.exit(1);
  }
};

module.exports = connectDB;
