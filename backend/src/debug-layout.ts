import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

const LayoutSchema = new mongoose.Schema(
  {
    theatreId: mongoose.Types.ObjectId,
    screenId: mongoose.Types.ObjectId,
    layoutName: String,
    status: String,
  },
  { collection: 'theatre_layouts' },
);

const MONGO_URI = process.env.MONGODB_URI;

async function run() {
  if (!MONGO_URI) {
    console.error('❌ MONGODB_URI is not defined');
    process.exit(1);
  }
  await mongoose.connect(MONGO_URI);
  const Layout = mongoose.model('Layout', LayoutSchema);
  
  const layouts = await Layout.find({ screenId: new mongoose.Types.ObjectId('6a23bd586204e64ae235bef0') });
  console.log('\n--- Layouts for Screen ---');
  layouts.forEach((l) => {
    console.log(
      `- ID: ${l._id} | Name: ${l.layoutName} | Status: ${l.status} | ScreenId: ${l.screenId}`
    );
  });
  
  await mongoose.disconnect();
}

run().catch(console.error);
