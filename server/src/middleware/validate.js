const AppError = require('../utils/AppError');

// validate(schema, 'body' | 'query' | 'params') — replaces the target with the parsed (typed, stripped) value
module.exports = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
    return next(new AppError(details[0] ? `${details[0].path ? details[0].path + ': ' : ''}${details[0].message}` : 'Invalid input', 422, details));
  }
  if (source === 'query') req.validatedQuery = result.data;
  else req[source] = result.data;
  next();
};
