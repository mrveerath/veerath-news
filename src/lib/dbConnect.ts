import mongoose, { Connection } from "mongoose";

// Global variable to cache the connection
let cachedConnection: {
  conn: Connection | null;
  promise: Promise<typeof mongoose> | null;
} = { conn: null, promise: null };

export async function dbConnect(): Promise<Connection> {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error(
      "Please define the MONGODB_URI environment variable inside .env.local"
    );
  }

  // If we have a cached connection, return it
  if (cachedConnection.conn) {
    return cachedConnection.conn;
  }

  // If no connection promise exists, create one
  if (!cachedConnection.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false, // Disable mongoose buffering
      autoIndex: process.env.NODE_ENV !== "production", // Only auto-create indexes in dev
    };

    cachedConnection.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log("MongoDB connected successfully");
        return mongoose;
      })
      .catch((err) => {
        console.error("MongoDB connection error:", err);
        throw err;
      });
  }

  try {
    // Wait for the connection promise to resolve
    const mongooseInstance = await cachedConnection.promise;
    cachedConnection.conn = mongooseInstance.connection;
    return cachedConnection.conn;
  } catch (err) {
    // If connection fails, reset the promise so we can retry
    cachedConnection.promise = null;
    throw err;
  }
}

// Optional: Graceful shutdown handler
process.on("SIGINT", async () => {
  if (cachedConnection.conn) {
    await cachedConnection.conn.close();
    console.log("MongoDB connection closed through app termination");
    process.exit(0);
  }
});