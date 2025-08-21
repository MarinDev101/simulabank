// Envuelve funciones async para evitar try/catch repetitivo en controllers
module.exports = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
