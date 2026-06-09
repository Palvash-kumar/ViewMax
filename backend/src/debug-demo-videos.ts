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

  const DemoVideoSchema = new mongoose.Schema(
    {},
    { strict: false, collection: 'demo_videos' },
  );
  const DemoVideo = mongoose.model('DemoVideo', DemoVideoSchema);

  const videos = await DemoVideo.find({
    screenId: new mongoose.Types.ObjectId('6a1f8faed1af0b4b795d52d0'),
  }).exec();
  console.log('--- Demo Videos ---');
  console.log(JSON.stringify(videos, null, 2));

  await mongoose.disconnect();
}

run().catch(console.error);
