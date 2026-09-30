const cloudinary = require('cloudinary').v2;
const env = require('./env');

const cloudinaryEnabled = Boolean(env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret);
if (cloudinaryEnabled) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
  });
}
module.exports = { cloudinary, cloudinaryEnabled };
