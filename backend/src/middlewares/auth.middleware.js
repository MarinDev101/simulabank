// const jwt = require('jsonwebtoken');

// //Verificamos JWT
// const verificarToken = (req, res, next) => {
//   const token = req.headers['authorization'];

//   if (!token) {
//     return res.status(403).json({ error: 'Acceso denegado' });
//   }

//   jwt.verify(token, 'mi_clave_secreta', (err, decoded) => {
//     if (err) {
//       return res.status(403).json({ error: 'Token inválido' });
//     }

//     console.log('Datos decodificados del token:', decoded); // Verifica los datos decodificados del token

//     req.user = decoded;
//     next();
//   });
// };

// module.exports = { verificarToken };
