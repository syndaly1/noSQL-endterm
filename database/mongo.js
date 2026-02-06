const { MongoClient } = require("mongodb");

let client;
let db;

async function connectMongo() {
  if (db) return db;
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("Missing MongoDB URI. Set MONGO_URI (required) in env.");
  }

  const dbName = process.env.MONGODB_DB || "readieg_library";

  client = new MongoClient(uri);
  await client.connect();

  db = client.db(dbName);

  await db.collection("books").createIndex({ title: 1 });
  await db.collection("books").createIndex({ author: 1 });
  await db.collection("books").createIndex({ tags: 1 });
  await db.collection("books").createIndex({ series: 1, seriesNumber: 1 });

  await db.collection("users").createIndex({ email: 1 }, { unique: true });

  return db;
}

function getDb() {
  if (!db) throw new Error("MongoDB is not connected yet.");
  return db;
}

async function closeMongo() {
  if (client) await client.close();
  client = null;
  db = null;
}

module.exports = { connectMongo, getDb, closeMongo };
