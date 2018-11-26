var assert = require('assert');
var reqo = require('../lib/reqo');
var { stub } = require('sinon');

describe('reqo', () => {
  it('should return a function', () => {
    const result = reqo();
    assert.equal(typeof result, 'function');
  });

  it('should throw a TypeError if options is not an object', () => {
    function harness() {
      reqo(() => {})(null);
    }

    assert.throws(harness, TypeError);
    assert.throws(harness, /options must be a plain object literal/);
  });

  it('should throw RangeError if options is missing a required key', () => {
    function harness() {
      const requiredOptions = ['optA', 'optB'];
      const resultFunc = reqo(() => {}, requiredOptions);

      // call the wrapped function without it's required options.
      resultFunc({});
    }

    assert.throws(harness, RangeError);
    assert.throws(harness, /Options must contain optA,optB/);
  });

  it('should validate and call the decorated underlying function', () => {
    const func = stub();
    const requiredOptions = ['optA', 'optB'];
    const options = { optA: 'alpha', optB: 'bravo' };
    const resultFunc = reqo(func, requiredOptions);

    resultFunc(options);

    assert(func.calledOnce);
    assert.deepEqual(func.args[0], [options]);
  });

  it(
    'should take an argument to customize which argument is options hash',
    () => {
      const func = stub();
      const requiredOptions = ['optA', 'optB'];
      const options = { optA: 'alpha', optB: 'bravo' };

      // Calling wrapper with optionsIndex of 1.
      const resultFunc = reqo(func, requiredOptions, 1);

      // Pass the options hash as the second argument.
      resultFunc('foo', options);

      assert(func.calledOnce);
      assert.deepEqual(func.args[0], ['foo', options]);
    }
  );

  it('should be able to maintain function context', () => {
    const requiredOptions = ['optA', 'optB'];
    const options = { optA: 'alpha', optB: 'bravo' };
    const obj = {
      myMethod: function(o) {
        return `${o.optA}:${o.optB}:${this.foo}`;
      },
      foo: 'bar'
    };

    // Wrap object method, pass obj as context argument.
    const resultFunc = reqo(obj.myMethod, requiredOptions, undefined, obj);

    const result = resultFunc(options);

    // Method call results in expected string.
    assert.equal(result, 'alpha:bravo:bar');
  });
});
