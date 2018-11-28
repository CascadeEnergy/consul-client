const { difference, keys, intersection, isEqual, isPlainObject } = require("lodash");

/**
 * Decorator which validates an options hash and delegates to `func`.
 * If the `options` are not an object a `TypeError` is thrown. If the options
 * hash is missing any of the required properties a `RangeError` is thrown.
 *
 * @param {Function} func The underlying function for which you want to validate
 * the options.
 *
 * @param {Array} requiredKeys An array describing the required option keys.
 *
 * @param {Number} optionsIndex The arguments index of the options hash you want
 * to validate. Defaults to 0, the first argument. This param is useful if your
 * options hash is not the first argument to the underlying function.
 *
 * @param {object} context Object to apply as the receiver for `func`.
 *
 * @returns {Function}
 */
function reqo(func, requiredKeys, optionsIndex = 0, context = undefined) {
  return function(...args) {
    const options = args[optionsIndex];

    if (!isPlainObject(options)) {
      throw new TypeError("options must be a plain object literal");
    }

    // Check that all of the properties represented in requiredKeys are present
    // as properties in the options hash. Does so by taking an intersection
    // of the options keys and the required keys, and then checking the
    // intersection is equivalent to the requirements.
    const optionsKeys = keys(options);
    const intersectionOfKeys = intersection(requiredKeys, optionsKeys);
    const hasAllRequiredKeys = isEqual(intersectionOfKeys, requiredKeys);

    // If any required keys are missing in options hash.
    if (!hasAllRequiredKeys) {
      const missingOptions = difference(requiredKeys, intersectionOfKeys);
      throw new RangeError(`Options must contain ${missingOptions.toString()}`);
    }

    // Call the decorated function in the right context with its' arguments.
    const boundFunc = func.bind(context);
    return boundFunc(...args);
  };
}

module.exports = reqo;
