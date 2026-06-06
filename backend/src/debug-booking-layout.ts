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
  
  const ShowtimeSchema = new mongoose.Schema({}, { strict: false, collection: 'showtimes' });
  const Showtime = mongoose.model('Showtime', ShowtimeSchema);
  
  const showtime = await Showtime.findById('6a236351d507744521ac58f8').exec();
  if (!showtime) {
    console.error('❌ Showtime not found');
    await mongoose.disconnect();
    return;
  }
  
  console.log('--- Showtime Details ---');
  console.log(JSON.stringify(showtime, null, 2));
  
  const screenId = (showtime as any).screenId;
  console.log(`\nScreen ID: ${screenId}`);
  
  const LayoutSchema = new mongoose.Schema({}, { strict: false, collection: 'theatre_layouts' });
  const Layout = mongoose.model('Layout', LayoutSchema);
  
  const layouts = await Layout.find({ screenId: new mongoose.Types.ObjectId(screenId) }).exec();
  console.log('\n--- Layouts for Screen ---');
  layouts.forEach((l) => {
    console.log(`- ID: ${l._id} | Name: ${l.get('layoutName')} | Status: ${l.get('status')}`);
    console.log('  ScreenConfig:', JSON.stringify(l.get('screenConfig'), null, 2));
    console.log('  Generated3DData.screen:', JSON.stringify(l.get('generated3DData')?.screen, null, 2));
  });

  await mongoose.disconnect();
}

run().catch(console.error);
