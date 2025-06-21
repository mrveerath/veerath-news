// src/lib/dbConnect.ts
import mongoose, { Mongoose } from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || "";

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

// Type for the cached connection
interface MongooseCache {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

// Augment the global namespace with our mongoose cache
declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache;
}

// Initialize the cache if it doesn't exist
if (!global.mongooseCache) {
  global.mongooseCache = { conn: null, promise: null };
}

const cache = global.mongooseCache;

/**
 * Establishes a connection to MongoDB using Mongoose
 * @returns {Promise<Mongoose>} The Mongoose connection
 * @throws {Error} If connection fails
 */
export async function dbConnect(): Promise<Mongoose> {
  // Return cached connection if available
  if (cache.conn) {
    return cache.conn;
  }

  // Create new connection promise if none exists
  if (!cache.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    cache.promise = mongoose.connect(MONGODB_URI, opts)
      .then((mongooseInstance: Mongoose) => {
        return mongooseInstance;
      })
      .catch((error: Error) => {
        // Reset promise on failure to allow retries
        cache.promise = null;
        throw error;
      });
  }

  try {
    // Await the connection promise
    cache.conn = await cache.promise;
  } catch (error) {
    // Reset both connection and promise on error
    cache.conn = null;
    cache.promise = null;
    throw error;
  }

  return cache.conn;
}

// Optional: Add disconnect functionality for testing/cleanup
export async function dbDisconnect(): Promise<void> {
  if (cache.conn) {
    await cache.conn.disconnect();
    cache.conn = null;
    cache.promise = null;
  }
}




// // src/lib/dbConnect.ts
// import mongoose, { Mongoose } from 'mongoose';

// const MONGODB_URI = process.env.MONGODB_URI || "";

// if (!MONGODB_URI) {
//   throw new Error('Please define the MONGODB_URI environment variable');
// }

// /**
//  * Establishes a fresh connection to MongoDB
//  * @returns {Promise<Mongoose>} The Mongoose connection
//  * @throws {Error} If connection fails
//  */
// export async function dbConnect(): Promise<Mongoose> {
//   const opts: mongoose.ConnectOptions = {
//     bufferCommands: false,       // Disable mongoose buffering
//     serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
//     socketTimeoutMS: 45000,      // Close sockets after 45s of inactivity
//   };

//   try {
//     const connection = await mongoose.connect(MONGODB_URI, opts);
//     console.log("Connected To Database")
//     return connection;
//   } catch (error) {
//     console.error('Database connection error:', error);
//     throw new Error('Failed to connect to database');
//   }
// }

// /**
//  * Disconnects from MongoDB
//  */
// export async function dbDisconnect(): Promise<void> {
//   try {
//     await mongoose.disconnect();
//   } catch (error) {
//     console.error('Database disconnection error:', error);
//   }
// }