import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable in .env.local'
  );
}

// Cached connection variable
let cachedConnection: typeof mongoose | null = null;

export async function dbConnect() {
  // If there is already a connection, return it
  if (cachedConnection) {
    console.log('Using existing database connection');
    return cachedConnection;
  }

  console.log('Connecting to database...');

  // Connect to the database
  const connection = await mongoose.connect(String(MONGODB_URI), {
    bufferCommands: false, // Disable mongoose buffering
  });

  // Cache the connection
  cachedConnection = connection;

  console.log('Database connected successfully');
  return cachedConnection;
}
