import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable in .env.local"
  );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function dbConnect() {
   console.log("connecting to db...0")
  if (cached.conn) {
    return cached.conn;
  }

  console.log("connecting to db...1")

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }
 console.log("connecting to db...2")
  try {
    cached.conn = await cached.promise;
    console.log("connected to db...")
    return cached.conn;
  } catch (e) {
    console.log(e)
    cached.promise = null;
    throw e;
  }
}