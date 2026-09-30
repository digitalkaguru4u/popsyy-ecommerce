const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { cloudinary, cloudinaryEnabled } = require('../config/cloudinary');
const env = require('../config/env');

const LOCAL_DIR = path.resolve(__dirname, '../../uploads');
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif', 'image/gif': 'gif' };

async function uploadImage(file, folder = 'popsyy/products') {
  if (cloudinaryEnabled) {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'image', transformation: [{ width: 1600, height: 1600, crop: 'limit' }] },
        (err, res) => (err ? reject(err) : resolve(res))
      );
      stream.end(file.buffer);
    });
    // f_auto,q_auto lets Cloudinary serve AVIF/WebP at the right quality per browser
    const url = result.secure_url.replace('/upload/', '/upload/f_auto,q_auto/');
    return { url, publicId: result.public_id, provider: 'cloudinary' };
  }
  // Local fallback (development / single-server deploys). Files served from /uploads.
  await fs.mkdir(LOCAL_DIR, { recursive: true });
  const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${EXT[file.mimetype] || 'bin'}`;
  await fs.writeFile(path.join(LOCAL_DIR, name), file.buffer);
  return { url: `${env.serverUrl}/uploads/${name}`, publicId: `local:${name}`, provider: 'local' };
}

async function deleteImage(publicId) {
  if (!publicId) return;
  try {
    if (publicId.startsWith('local:')) await fs.unlink(path.join(LOCAL_DIR, publicId.slice(6)));
    else if (cloudinaryEnabled) await cloudinary.uploader.destroy(publicId);
  } catch { /* already gone */ }
}

module.exports = { uploadImage, deleteImage, LOCAL_DIR, cloudinaryEnabled };
