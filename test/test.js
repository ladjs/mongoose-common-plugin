const test = require('ava');

const mongooseCommonPlugin = require('..');

test('returns function', t => {
  t.true(typeof mongooseCommonPlugin === 'function');
});
