import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;

async function run() {
  if (!MONGO_URI) {
    console.error('❌ MONGODB_URI not defined');
    process.exit(1);
  }
  await mongoose.connect(MONGO_URI);

  const CoordinateSchema = new mongoose.Schema(
    {},
    { strict: false, collection: 'theatre_coordinates' },
  );
  const Coordinate = mongoose.model('Coordinate', CoordinateSchema);

  const coords = await Coordinate.find({
    layoutId: new mongoose.Types.ObjectId('6a1f8fb9d1af0b4b795d52d4'),
  }).exec();
  console.log('--- Seat Coordinates ---');
  coords.slice(0, 10).forEach((c) => {
    console.log(
      `Seat: ${c.get('seatId')} | x: ${c.get('x')} | y: ${c.get('y')} | z: ${c.get('z')}`,
    );
  });

  await mongoose.disconnect();
}

run().catch(console.error);
