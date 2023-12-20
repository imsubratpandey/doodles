//mongodb collections configuration
require("dotenv").config();
const { MongoClient } = require("mongodb");
const client = new MongoClient(process.env.MONGO_URL);
const db = client.db("doodles");
client.connect();
const Users = db.collection("users");
const Sessions = db.collection("sessions");
const Playgrounds = db.collection("playgrounds");
Playgrounds.createIndex({ "createdAt": 1 }, { expireAfterSeconds: 86400 });
module.exports = { Users, Sessions, Playgrounds };