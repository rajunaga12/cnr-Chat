const cloudinary = require('cloudinary');

cloudinary.config({ 
    cloud_name: 'raju', 
    api_key: '754353168487122', 
    api_secret: 'U4p5UZDMKxMk6jQBGUM9kZiiYBE'
  });

  module.exports = cloudinary;