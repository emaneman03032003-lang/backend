// Upload Controller (local storage via multer)
const fs = require('fs');
const path = require('path');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Upload Image
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file provided' });

    const file = req.file;
    const fileName = `products-${Date.now()}-${file.originalname}`;
    const filePath = path.join(UPLOAD_DIR, fileName);

    fs.writeFileSync(filePath, file.buffer);

    // Return relative URL for access
    const imageUrl = `/uploads/${fileName}`;
    res.json({ success: true, message: 'Image uploaded', imageUrl, fileName });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload image', error: error.message });
  }
};

// Delete Image
exports.deleteImage = async (req, res) => {
  try {
    const { fileName } = req.body;
    if (!fileName) return res.status(400).json({ success: false, message: 'File name required' });

    const filePath = path.join(UPLOAD_DIR, fileName);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    res.json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete image', error: error.message });
  }
};
