import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

const TheatreSchema = new mongoose.Schema(
  {
    ownerId: mongoose.Types.ObjectId,
    name: String,
    city: String,
    status: String,
    address: String,
  },
  { collection: 'theatres' },
);

const MONGO_URI = process.env.MONGODB_URI;

async function run() {
  if (!MONGO_URI) {
    console.error('❌ MONGODB_URI is not defined in the environment variables');
    process.exit(1);
  }
  await mongoose.connect(MONGO_URI);
  const Theatre = mongoose.model('Theatre', TheatreSchema);
  const theatres = await Theatre.find({});
  console.log('\n--- Theatres in Database ---');
  theatres.forEach((t) => {
    console.log(
      `- ID: ${t._id} | Name: ${t.name} | City: ${t.city} | OwnerId: ${t.ownerId} | Status: ${t.status}`,
    );
  });
  await mongoose.disconnect();
}

run().catch(console.error);
