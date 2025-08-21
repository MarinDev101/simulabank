const db = require("../config/db");

const tabla = 'personas';
const idCampo = 'id_persona';

class PersonasController {
  // Obtener todas las personas
  async obtenerTodos(req, res) {
    try {
      const [resultados] = await db.query(`SELECT * FROM ${tabla}`);
      res.json(resultados);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Obtener una persona por ID
  async obtenerUno(req, res) {
    try {
      const { id } = req.params;
      const [resultado] = await db.query(`SELECT * FROM ?? WHERE ?? = ?`, [tabla, idCampo, id]);
      if (!resultado[0]) {
        return res.status(404).json({ error: 'Registro no encontrado.' });
      }
      res.json(resultado[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Crear una nueva persona
  async crear(req, res) {
    if ('id_persona' in req.body) {
      return res.status(400).json({ error: 'No se permite enviar id_persona en la solicitud.' });
    }
    try {
      const [resultado] = await db.query(`INSERT INTO ?? SET ?`, [tabla, req.body]);
      res.status(201).json({ id_persona: resultado.insertId , ...req.body });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Actualizar una persona por ID
  async actualizar(req, res) {
    if ('id_persona' in req.body) {
      return res.status(400).json({ error: 'No se permite enviar id_persona en la solicitud.' });
    }
    try {
      const { id } = req.params;
      const [resultado] = await db.query(`UPDATE ?? SET ? WHERE ?? = ?`, [tabla, req.body, idCampo, id]);
      if (resultado.affectedRows === 0) {
        return res.status(404).json({ error: 'Registro no encontrado.' });
      }
      res.json({ id_persona: id, ...req.body });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Eliminar una persona por ID
  async eliminar(req, res) {
    try {
      const { id } = req.params;
      const [resultado] = await db.query(`DELETE FROM ?? WHERE ?? = ?`, [tabla, idCampo, id]);
      if (resultado.affectedRows === 0) {
        return res.status(404).json({ error: 'Registro no encontrado.' });
      }
      res.json({ mensaje: 'Registro eliminado correctamente.' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new PersonasController();
