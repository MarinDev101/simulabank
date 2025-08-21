const db = require('../config/conexion_DB');

class CrudController {
    constructor(tabla, idCampo) {
        this.tabla = tabla;
        this.idCampo = idCampo;
    }

    async obtenerTodos() {
        const [resultados] = await db.query(`SELECT * FROM ??`, [this.tabla]);
        return resultados;
    }

    async obtenerUno(id) {
        const [resultado] = await db.query(`SELECT * FROM ?? WHERE ?? = ?`, [this.tabla, this.idCampo, id]);
        return resultado[0];
    }

    async crear(data) {
        const [resultado] = await db.query(`INSERT INTO ?? SET ?`, [this.tabla, data]);
        return { ...data, id: resultado.insertId };
    }

    async actualizar(id, data) {
        const [resultado] = await db.query(`UPDATE ?? SET ? WHERE ?? = ?`, [this.tabla, data, this.idCampo, id]);
        if (!resultado.affectedRows) throw new Error('Registro no encontrado');
        return await this.obtenerUno(id);
    }

    async eliminar(id) {
        const [resultado] = await db.query(`DELETE FROM ?? WHERE ?? = ?`, [this.tabla, this.idCampo, id]);
        if (!resultado.affectedRows) throw new Error('Registro no encontrado');
        return { message: 'Registro eliminado exitosamente' };
    }
}

module.exports = CrudController;
