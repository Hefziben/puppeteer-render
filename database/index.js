const { connect } = require("mongoose");
const { MongoClient } = require('mongodb');




async function connectDB(){
  /**
   * Connection URI. Update <username>, <password>, and <your-cluster-url> to reflect your cluster.
   * See https://docs.mongodb.com/ecosystem/drivers/node/ for more details
   */
  const uri = "mongodb+srv://hefziben:ilive4him@database.ghufx.mongodb.net/iabot?retryWrites=true&w=majority";  


  const client = new MongoClient(uri);

  try {
      // Connect to the MongoDB cluster
      await client.connect();
      console.log('connected db');
      

      // Make the appropriate DB calls
      // await  listDatabases(client);

  } catch (e) {
      console.error(e);
  } finally {
      await client.close();
  }
}

async function listDatabases(client){
  databasesList = await client.db().admin().listDatabases();
  console.log("Databases:");
  databasesList.databases.forEach(db => console.log(` - ${db.name}`));
};

connectDB().catch(console.error);

// const mongoURI = process.env.MONGODB_URL;
// console.log("MongoDB Connected...", mongoURI);
// const connectDB = async () => {
//   try {
//     await connect(mongoURI);
//     console.log("MongoDB Connected...");
//   } catch (err) {
//     console.error(err);
//     console.log("MongoDB err...", err);
//     process.exit(1);
//   }
// };

module.exports = connectDB;
