const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Image upload configuration
const imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const userDir = path.join(uploadsDir, 'images');
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    cb(null, userDir);
  },
  filename: function (req, file, cb) {
    const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, uniquePrefix + extension);
  }
});

// Avatar upload configuration
const avatarStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const avatarDir = path.join(uploadsDir, 'avatars');
    if (!fs.existsSync(avatarDir)) {
      fs.mkdirSync(avatarDir, { recursive: true });
    }
    cb(null, avatarDir);
  },
  filename: function (req, file, cb) {
    const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, uniquePrefix + extension);
  }
});

// File filter function
const imageFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Not an allowed image type. Please upload JPEG, JPG, PNG, or GIF.'), false);
  }
};

// Setup multer for image uploads
const uploadImage = multer({ 
  storage: imageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: imageFilter
});

// Setup multer for avatar uploads
const uploadAvatar = multer({ 
  storage: avatarStorage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB max file size for avatars
  },
  fileFilter: imageFilter
});

module.exports = {
  uploadImage,
  uploadAvatar
}; 