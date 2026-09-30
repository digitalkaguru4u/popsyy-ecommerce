const mongoose = require('mongoose');
const env = require('./env');

mongoose.set('strictQuery', true);

async function connectDB(uri = env.mongoUri) {
  await mongoose.connect(uri, { autoIndex: !env.isProd || process.env.MONGO_AUTO_INDEX === 'true' });
  if (!env.isTest) console.log(`[db] connected ${mongoose.connection.host}/${mongoose.connection.name}`);
  return mongoose.connection;
}

module.exports = { connectDB };
