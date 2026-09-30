const asyncHandler = require('./asyncHandler');
// Wrap every exported controller function so async errors reach the error middleware
module.exports = (controller) => Object.fromEntries(Object.entries(controller).map(([k, fn]) => [k, typeof fn === 'function' ? asyncHandler(fn) : fn]));
