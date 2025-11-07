const multer = require('multer');
const path = require('path');

// Usar memoria para obtener buffer directamente y convertir a base64 fácilmente.
// Para archivos grandes o producción, considera usar disco o almacenamiento en la nube.
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB por archivo por defecto
  fileFilter: (req, file, cb) => {
    const allowedExt = ['.png', '.jpg', '.jpeg', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExt.includes(ext)) {
      return cb(new Error('Tipo de archivo no permitido'));
    }
    cb(null, true);
  },
});

module.exports = { upload };
