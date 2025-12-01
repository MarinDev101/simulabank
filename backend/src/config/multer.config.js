const multer = require('multer');
const path = require('path');

// Usar memoria para obtener buffer directamente y convertir a base64 fácilmente.
// Para archivos grandes o producción, considera usar disco o almacenamiento en la nube.
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB por archivo
  fileFilter: (req, file, cb) => {
    // Solo aceptar jpeg y png
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (file && file.mimetype && allowedTypes.includes(file.mimetype)) {
      return cb(null, true);
    }

    // Backup: aceptar extensiones .jpg, .jpeg, .png
    const allowedExt = ['.png', '.jpg', '.jpeg'];
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (ext && allowedExt.includes(ext)) {
      return cb(null, true);
    }

    return cb(new Error('Solo se permiten archivos JPEG o PNG'));
  },
});

module.exports = { upload };
