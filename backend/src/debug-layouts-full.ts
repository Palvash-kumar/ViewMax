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
  
  const LayoutSchema = new mongoose.Schema({}, { strict: false, collection: 'theatre_layouts' });
  const Layout = mongoose.model('Layout', LayoutSchema);
  
  const layouts = await Layout.find({
    screenId: new mongoose.Types.ObjectId('6a23bd586204e64ae235bef0')
  }).exec();
  
  console.log(JSON.stringify(layouts, null, 2));
  
  await mongoose.disconnect();
}

run().catch(console.error);
