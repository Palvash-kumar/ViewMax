import * as mongoose from 'mongoose';

const TheatreSchema = new mongoose.Schema({
  ownerId: mongoose.Types.ObjectId,
  name: String,
  city: String,
  status: String,
  address: String
}, { collection: 'theatres' });

const MONGO_URI = 'mongodb+srv://viewmax010699_db_user:12345678900@viewmax.d2fhkax.mongodb.net/';

async function run() {
  await mongoose.connect(MONGO_URI);
  const Theatre = mongoose.model('Theatre', TheatreSchema);
  const theatres = await Theatre.find({});
  console.log('\n--- Theatres in Database ---');
  theatres.forEach(t => {
    console.log(`- ID: ${t._id} | Name: ${t.name} | City: ${t.city} | OwnerId: ${t.ownerId} | Status: ${t.status}`);
  });
  await mongoose.disconnect();
}

run().catch(console.error);
