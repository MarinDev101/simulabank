const multer = require('multer');
const path = require('path');

// Usar memoria para obtener buffer directamente y convertir a base64 fácilmente.
// Para archivos grandes o producción, considera usar disco o almacenamiento en la nube.
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB por archivo por defecto
  fileFilter: (req, file, cb) => {
    // Aceptar por tipo MIME cuando sea una imagen (más fiable si el cliente no envía extensión)
    if (file && file.mimetype && file.mimetype.startsWith('image/')) {
      return cb(null, true);
    }

    // Backup: aceptar algunas extensiones comunes si por alguna razón no hay mimetype
    const allowedExt = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.heic', '.jfif'];
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (ext && allowedExt.includes(ext)) {
      return cb(null, true);
    }

    return cb(new Error('Tipo de archivo no permitido'));
  },
});

module.exports = { upload };
