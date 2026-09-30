const multer = require('multer');
const AppError = require('../utils/AppError');

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];

module.exports = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED.includes(file.mimetype)) return cb(new AppError('Only JPG, PNG, WEBP, AVIF, or GIF images are allowed', 400));
    cb(null, true);
  },
});
