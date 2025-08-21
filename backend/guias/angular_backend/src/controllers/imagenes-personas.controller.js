const db = require("../config/db");

const tabla = 'personas';
const idCampo = 'id_persona';

class ImagenesPersonasController {
  // Subir o actualizar una imagen codificada en base64 a un registro específico
  async subirImagen(req, res) {
    const { id } = req.params;
    const imagenBase64 = req.body.imagen;
    if (!imagenBase64) {
      res.status(400).json({ error: 'Se requiere la imagen en base64', status: 400 });
      return;
    }
    try {
      const [registro] = await db.query(`SELECT * FROM ?? WHERE ?? = ?`, [tabla, idCampo, id]);
      if (registro.length === 0) {
        res.status(404).json({ error: 'No se encontró el registro con el ID proporcionado.', status: 404 });
        return;
      }
      const bufferImagen = Buffer.from(imagenBase64, 'base64');
      const query = `UPDATE ?? SET imagen = ? WHERE ?? = ?`;
      const [result] = await db.query(query, [tabla, bufferImagen, idCampo, id]);
      if (result.affectedRows > 0) {
        res.status(200).json({ message: 'Imagen actualizada correctamente.', status: 200 });
      } else {
        res.status(500).json({ error: 'Error al actualizar la imagen.', status: 500 });
      }
    } catch (error) {
      res.status(500).json({ error: 'Error al subir la imagen', status: 500 });
    }
  }

  // Obtener una imagen desde un registro y devolverla en formato base64
  async obtenerImagen(req, res) {
    const { id } = req.params;
    try {
      const [rows] = await db.query(`SELECT imagen FROM ?? WHERE ?? = ?`, [tabla, idCampo, id]);
      if (rows.length === 0) {
        res.status(404).json({ error: 'Registro no encontrado', status: 404 });
        return;
      }
      if (!rows[0].imagen) {
        res.status(200).json({ imagen: null, status: 200 });
        return;
      }
      const imagenBase64 = rows[0].imagen.toString('base64');
      res.status(200).json({ imagen: imagenBase64, status: 200 });
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener la imagen', status: 500 });
    }
  }

  // Eliminar una imagen (establece el campo imagen como NULL)
  async eliminarImagen(req, res) {
    const { id } = req.params;
    try {
      const [registro] = await db.query(`SELECT * FROM ?? WHERE ?? = ?`, [tabla, idCampo, id]);
      if (registro.length === 0) {
        res.status(404).json({ error: 'No se encontró el registro con el ID proporcionado.', status: 404 });
        return;
      }
      const query = `UPDATE ?? SET imagen = NULL WHERE ?? = ?`;
      const [result] = await db.query(query, [tabla, idCampo, id]);
      if (result.affectedRows > 0) {
        res.status(200).json({ message: 'Imagen eliminada correctamente.', status: 200 });
      } else {
        res.status(500).json({ error: 'Error al eliminar la imagen.', status: 500 });
      }
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar la imagen', status: 500 });
    }
  }

  // Insertar una imagen (igual que subir, pero puede usarse para lógica diferente si se requiere)
  async insertarImagen(req, res) {
    const { id } = req.params;
    const imagenBase64 = req.body.imagen;
    if (!imagenBase64) {
      res.status(400).json({ error: 'Se requiere la imagen en base64', status: 400 });
      return;
    }
    try {
      const [registro] = await db.query(`SELECT * FROM ?? WHERE ?? = ?`, [tabla, idCampo, id]);
      if (registro.length === 0) {
        res.status(404).json({ error: 'No se encontró el registro con el ID proporcionado.', status: 404 });
        return;
      }
      const bufferImagen = Buffer.from(imagenBase64, 'base64');
      const query = `UPDATE ?? SET imagen = ? WHERE ?? = ?`;
      const [result] = await db.query(query, [tabla, bufferImagen, idCampo, id]);
      if (result.affectedRows > 0) {
        res.status(200).json({ message: 'Imagen insertada correctamente.', status: 200 });
      } else {
        res.status(500).json({ error: 'Error al insertar la imagen.', status: 500 });
      }
    } catch (error) {
      res.status(500).json({ error: 'Error al insertar la imagen', status: 500 });
    }
  }
}

module.exports = new ImagenesPersonasController();
