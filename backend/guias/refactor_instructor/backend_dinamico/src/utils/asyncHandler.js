module.exports = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
// const asyncHandler = require('../utils/asyncHandler');
// const CrudController = require('../controllers/crud.controller');