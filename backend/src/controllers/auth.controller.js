const { pool } = require('../config/database.config');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { jwt: jwtConfig } = require('../config/env.config');
const tokenService = require('../services/token');
const { TABLAS, CAMPOS_ID, ESTADOS, ROLES } = require('../constants/auth.constants');
const { mapUsuarioToDb, mapDbToUsuario } = require('../models/usuario.model');
const emailService = require('../services/email');
const verificacionService = require('../services/verificacion');

class AuthController {

  async iniciarRegistro(req, res) {
    const { correo, nombres, apellidos, contrasena } = req.body;

    // Validación básica
    if (!correo || !nombres || !apellidos || !contrasena) {
      return res.status(400).json({
        success: false,
        error: 'Todos los campos son requeridos',
      });
    }

    try {
      // Verificar si el correo ya existe
      const [existeUsuario] = await pool.query(
        'SELECT id_usuario FROM usuarios WHERE correo_electronico = ? LIMIT 1',
        [correo]
      );

      if (existeUsuario.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Este correo ya está registrado',
        });
      }

      // Generar y guardar código
      const codigo = await verificacionService.guardarCodigoVerificacion(
        correo,
        nombres,
        apellidos,
        contrasena
      );

      // Enviar código por email
      await emailService.enviarCodigoVerificacion(correo, codigo, nombres);

      return res.json({
        success: true,
        message: 'Código de verificación enviado al correo',
        correo: correo,
      });
    } catch (error) {
      console.error('Error en iniciarRegistro:', error);
      return res.status(500).json({
        success: false,
        error: 'Error al procesar el registro. Intenta nuevamente.',
      });
    }
  }

  async verificarCodigoRegistro(req, res) {
    const { correo, codigo } = req.body;

    if (!correo || !codigo) {
      return res.status(400).json({
        success: false,
        error: 'Correo y código son requeridos',
      });
    }

    try {
      // Verificar el código
      const datosVerificacion = await verificacionService.verificarCodigo(correo, codigo);

      if (!datosVerificacion) {
        return res.status(400).json({
          success: false,
          error: 'Código inválido o expirado',
        });
      }

      // Crear el usuario
      const nuevoUsuario = {
        correo_electronico: datosVerificacion.correo_electronico,
        contrasena: datosVerificacion.contrasena_hash,
        nombres: datosVerificacion.nombres,
        apellidos: datosVerificacion.apellidos,
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date(),
        estado: 'activo',
      };

      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();

        // Insertar usuario
        const [insertRes] = await conn.query('INSERT INTO usuarios SET ?', nuevoUsuario);
        const userId = insertRes.insertId;

        // Asignar rol de aprendiz por defecto
        await conn.query('INSERT INTO aprendices (id_aprendiz) VALUES (?)', [userId]);

        // Marcar código como usado
        await verificacionService.marcarCodigoUsado(correo, codigo);

        await conn.commit();

        // Generar tokens
        const token = jwt.sign(
          { id: userId, correo: nuevoUsuario.correo_electronico, rol: 'aprendiz' },
          jwtConfig.secret,
          { expiresIn: jwtConfig.expiresIn }
        );

        const refreshToken = jwt.sign({ id: userId }, jwtConfig.secret, {
          expiresIn: jwtConfig.refreshExpiresIn,
        });

        // Guardar refresh token
        const meta = {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
        };

        await tokenService.saveRefreshToken(refreshToken, userId, jwtConfig.refreshExpiresIn, meta);

        return res.status(201).json({
          success: true,
          message: 'Cuenta creada exitosamente',
          token,
          refreshToken,
          user: {
            id: userId,
            correo: nuevoUsuario.correo_electronico,
            nombres: nuevoUsuario.nombres,
            apellidos: nuevoUsuario.apellidos,
            rol: 'aprendiz',
          },
        });
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error('Error en verificarCodigoRegistro:', error);
      return res.status(500).json({
        success: false,
        error: 'Error al verificar el código. Intenta nuevamente.',
      });
    }
  }

  async registrar(req, res) {
    const { correo, nombres, apellidos, rol = ROLES.APRENDIZ, contrasena } = req.body;

    // Validación básica
    if (!correo || !contrasena || !nombres || !apellidos) {
      return res.status(400).json({
        success: false,
        error: 'correo, contrasena, nombres y apellidos son requeridos',
      });
    }

    // Normalizar rol
    const rolNormalizado = this._normalizarRol(rol);
    if (!rolNormalizado) {
      return res.status(400).json({
        success: false,
        error: 'Rol inválido. Permitidos: aprendiz, instructor',
      });
    }

    // Verificar si el correo existe - CONSULTA PREPARADA CORRECTA
    const queryVerificarCorreo = 'SELECT ?? FROM ?? WHERE correo_electronico = ? LIMIT 1';
    const [exists] = await pool.query(queryVerificarCorreo, [
      CAMPOS_ID.USUARIO,
      TABLAS.USUARIOS,
      correo,
    ]);

    if (exists.length > 0) {
      return res.status(400).json({ success: false, error: 'Correo ya registrado' });
    }

    // Crear usuario
    const hashed = await bcrypt.hash(contrasena, 10);
    const nuevoUsuario = mapUsuarioToDb({
      correo_electronico: correo,
      contrasena: hashed,
      nombres,
      apellidos,
      fecha_creacion: new Date(),
      fecha_actualizacion: new Date(),
      estado: ESTADOS.ACTIVO,
    });

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Insertar usuario - usando SET ? que es seguro con mysql2
      const [insertRes] = await conn.query('INSERT INTO ?? SET ?', [TABLAS.USUARIOS, nuevoUsuario]);
      const userId = insertRes.insertId;

      // Insertar en tabla de rol - si es administrador, insertar en administradores; si no, en instructores/aprendices
      if (rolNormalizado === ROLES.ADMINISTRADOR) {
        await conn.query('INSERT INTO ?? (??) VALUES (?)', [
          TABLAS.ADMINISTRADORES,
          CAMPOS_ID.ADMINISTRADOR,
          userId,
        ]);
      } else {
        const tablaRol =
          rolNormalizado === ROLES.INSTRUCTOR ? TABLAS.INSTRUCTORES : TABLAS.APRENDICES;
        const campoId =
          rolNormalizado === ROLES.INSTRUCTOR ? CAMPOS_ID.INSTRUCTOR : CAMPOS_ID.APRENDIZ;
        await conn.query('INSERT INTO ?? (??) VALUES (?)', [tablaRol, campoId, userId]);
      }

      await conn.commit();

      return res.status(201).json({
        success: true,
        id: userId,
        rol: rolNormalizado,
      });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async login(req, res) {
    const { correo, contrasena } = req.body;

    if (!correo || !contrasena) {
      return res.status(400).json({
        success: false,
        error: 'correo y contrasena requeridos',
      });
    }

    // Buscar usuario - CONSULTA PREPARADA
    const queryLogin = `
      SELECT *
      FROM ??
      WHERE correo_electronico = ?
      LIMIT 1
    `;
    const [usuarios] = await pool.query(queryLogin, [TABLAS.USUARIOS, correo]);

    if (!usuarios.length) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
    }

    const user = mapDbToUsuario(usuarios[0]);

    // Verificar estado
    if (String(user.estado || '').toLowerCase() !== ESTADOS.ACTIVO) {
      return res.status(401).json({
        success: false,
        error: 'Cuenta inactiva. Contacte al administrador.',
      });
    }

    // Verificar contraseña
    const match = await bcrypt.compare(contrasena, user.contrasena);
    if (!match) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
    }

    // Determinar rol
    const rol = await this._determinarRol(user.id);

    // Generar tokens (access contiene rol para autorización)
    const token = jwt.sign({ id: user.id, correo: user.correo, rol }, jwtConfig.secret, {
      expiresIn: jwtConfig.expiresIn,
    });
    const refreshToken = jwt.sign({ id: user.id }, jwtConfig.secret, {
      expiresIn: jwtConfig.refreshExpiresIn,
    });

    // Guardar refresh token
    const meta = {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    };

    await tokenService.saveRefreshToken(refreshToken, user.id, jwtConfig.refreshExpiresIn, meta);

    // Actualizar último acceso - CONSULTA PREPARADA
    const queryActualizarAcceso = 'UPDATE ?? SET ultimo_acceso = NOW() WHERE ?? = ?';
    await pool.query(queryActualizarAcceso, [TABLAS.USUARIOS, CAMPOS_ID.USUARIO, user.id]);

    return res.json({
      success: true,
      token,
      refreshToken,
      user: {
        id: user.id,
        correo: user.correo,
        nombres: user.nombres,
        apellidos: user.apellidos,
        rol,
        foto_perfil: user.foto_perfil || null,
        fecha_nacimiento: user.fecha_nacimiento || null,
        genero: user.genero || null,
        preferencia_tema: user.preferencia_tema || null,
      },
    });
  }

  async perfil(req, res) {
    // req.user debe estar poblado por middleware de autenticación
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ success: false, error: 'No autenticado' });

    const [rows] = await pool.query('SELECT * FROM ?? WHERE ?? = ? LIMIT 1', [
      TABLAS.USUARIOS,
      CAMPOS_ID.USUARIO,
      userId,
    ]);
    if (!rows.length)
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });

    const usuario = mapDbToUsuario(rows[0]);
    const rol = await this._determinarRol(usuario.id);

    return res.json({ success: true, user: { ...usuario, rol } });
  }

  async refresh(req, res) {
    const { refreshToken } = req.body;

    const valid = await tokenService.isRefreshTokenValid(refreshToken);
    if (!valid) {
      return res.status(401).json({ success: false, error: 'Refresh token inválido' });
    }

    const decoded = jwt.verify(refreshToken, jwtConfig.secret);
    await tokenService.revokeRefreshToken(refreshToken);

    // Generar nuevos tokens
    const newToken = jwt.sign({ id: decoded.id }, jwtConfig.secret, {
      expiresIn: jwtConfig.expiresIn,
    });

    const newRefresh = jwt.sign({ id: decoded.id }, jwtConfig.secret, {
      expiresIn: jwtConfig.refreshExpiresIn,
    });

    const meta = {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    };

    await tokenService.saveRefreshToken(newRefresh, decoded.id, jwtConfig.refreshExpiresIn, meta);

    return res.json({
      success: true,
      token: newToken,
      refreshToken: newRefresh,
    });
  }

  async logout(req, res) {
    const { refreshToken } = req.body;
    await tokenService.revokeRefreshToken(refreshToken);
    return res.json({ success: true });
  }

  async listSessions(req, res) {
    const sessions = await tokenService.listSessions(req.user.id);
    return res.json({ success: true, sessions });
  }

  async logoutAll(req, res) {
    await tokenService.revokeAll(req.user.id);
    return res.json({ success: true });
  }

  async revokeSession(req, res) {
    const id = parseInt(req.params.id, 10);
    await tokenService.revokeBySessionId(id);
    return res.json({ success: true });
  }

  async adminEndpoint(req, res) {
    return res.json({
      success: true,
      message: 'Acceso de administrador verificado',
      user: req.user,
    });
  }

  // =========================================================
  // Métodos auxiliares
  // =========================================================
  _normalizarRol(rol) {
    const normalized = rol.toLowerCase();
    if ([ROLES.APRENDIZ, 'aprendices'].includes(normalized)) return ROLES.APRENDIZ;
    if ([ROLES.INSTRUCTOR, 'instructores'].includes(normalized)) return ROLES.INSTRUCTOR;
    return null;
  }

  async _determinarRol(userId) {
    // CONSULTAS PREPARADAS para determinar rol
    const queryAdmin = 'SELECT 1 FROM ?? WHERE ?? = ? LIMIT 1';
    const queryInstructor = 'SELECT 1 FROM ?? WHERE ?? = ? LIMIT 1';
    const queryAprendiz = 'SELECT 1 FROM ?? WHERE ?? = ? LIMIT 1';

    const [[admin], [instructor], [aprendiz]] = await Promise.all([
      pool.query(queryAdmin, [TABLAS.ADMINISTRADORES, CAMPOS_ID.ADMINISTRADOR, userId]),
      pool.query(queryInstructor, [TABLAS.INSTRUCTORES, CAMPOS_ID.INSTRUCTOR, userId]),
      pool.query(queryAprendiz, [TABLAS.APRENDICES, CAMPOS_ID.APRENDIZ, userId]),
    ]);

    if (admin.length > 0) return ROLES.ADMINISTRADOR;
    if (instructor.length > 0) return ROLES.INSTRUCTOR;
    if (aprendiz.length > 0) return ROLES.APRENDIZ;
    return ROLES.USUARIO;
  }
}

module.exports = new AuthController();
