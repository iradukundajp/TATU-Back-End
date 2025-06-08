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
    const extension = path.extname(file.originalname) || '.jpg'; // Default to jpg if no extension
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
    const extension = path.extname(file.originalname) || '.jpg'; // Default to jpg if no extension
    cb(null, uniquePrefix + extension);
  }
});

// Custom Tattoo upload configuration
// const customTattooStorage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     const userId = req.user ? req.user.id : 'anonymous'; 
//     const tattooDir = path.join(uploadsDir, 'custom_tattoos', userId);
//     if (!fs.existsSync(tattooDir)) {
//       fs.mkdirSync(tattooDir, { recursive: true });
//     }
//     cb(null, tattooDir);
//   },
//   filename: function (req, file, cb) {
//     const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1e9);
//     const extension = path.extname(file.originalname) || '.png'; // Default to png for tattoos
//     cb(null, uniquePrefix + extension);
//   }
// });

// Use memoryStorage for ImageKit uploads to get the buffer
const customTattooMemoryStorage = multer.memoryStorage();

// File filter function
const imageFilter = (req, file, cb) => {
  console.log('Received file in multer:', file);
  
  // Allow all image types for now, we'll validate format later if needed
  if (file.mimetype.startsWith('image/') || file.mimetype === 'application/octet-stream') {
    cb(null, true);
  } else {
    cb(new Error(`Not an allowed image type: ${file.mimetype}. Please upload a valid image.`), false);
  }
};

// Setup multer for image uploads with better logging
const uploadImage = multer({ 
  storage: imageStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
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

// Setup multer for custom tattoo uploads
const uploadCustomTattoo = multer({ 
  // storage: customTattooStorage, // Changed to memoryStorage
  storage: customTattooMemoryStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size for custom tattoos
  },
  fileFilter: imageFilter
});

module.exports = {
  uploadImage,
  uploadAvatar,
  uploadCustomTattoo // Export the new uploader
};