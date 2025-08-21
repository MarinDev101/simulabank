const db = require('../config/conexion_DB');

class CrudController {
    constructor(tabla, idCampo) {
        this.tabla = tabla;
        this.idCampo = idCampo;
    }

    async obtenerTodos({ page = 1, limit = 10, filters = {}, sortBy, order = 'ASC' }) {
        const offset = (page - 1) * limit;
        const filterKeys = Object.keys(filters).filter(key => filters[key] !== undefined);
        
        let sql = `SELECT * FROM ??`;
        const params = [this.tabla];

        // Filtros dinámicos
        if (filterKeys.length) {
            const where = filterKeys.map(key => `?? LIKE ?`).join(' AND ');
            sql += ` WHERE ${where}`;
            filterKeys.forEach(key => {
                params.push(key, `%${filters[key]}%`);
            });
        }

        // Orden
        if (sortBy) {
            sql += ` ORDER BY ?? ${order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'}`;
            params.push(sortBy);
        }

        // Paginación
        sql += ` LIMIT ? OFFSET ?`;
        params.push(Number(limit), Number(offset));

        const [resultados] = await db.query(sql, params);

        // Contar total para devolver metadata
        const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM ??`, [this.tabla]);

        return {
            page: Number(page),
            limit: Number(limit),
            total,
            data: resultados
        };
    }

    async obtenerUno(id) {
        const [resultado] = await db.query(`SELECT * FROM ?? WHERE ?? = ?`, [this.tabla, this.idCampo, id]);
        return resultado[0];
    }

    async crear(data) {
        const [resultado] = await db.query(`INSERT INTO ?? SET ?`, [this.tabla, data]);
        return { ...data, [this.idCampo]: resultado.insertId };
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
