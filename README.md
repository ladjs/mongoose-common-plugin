# mongoose-common-plugin

[![build status](https://img.shields.io/travis/ladjs/mongoose-common-plugin.svg)](https://travis-ci.org/ladjs/mongoose-common-plugin)
[![code coverage](https://img.shields.io/codecov/c/github/ladjs/mongoose-common-plugin.svg)](https://codecov.io/gh/ladjs/mongoose-common-plugin)
[![code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![made with lass](https://img.shields.io/badge/made_with-lass-95CC28.svg)](https://lass.js.org)
[![license](https://img.shields.io/github/license/ladjs/mongoose-common-plugin.svg)](<>)

> Common plugin for Mongoose with standard schema fields and localization support


## Table of Contents

* [Install](#install)
* [Usage](#usage)
* [Options](#options)
* [Localized Error Messages](#localized-error-messages)
* [Contributors](#contributors)
* [License](#license)


## Install

[npm][]:

```sh
npm install mongoose-common-plugin
```

[yarn][]:

```sh
yarn add mongoose-common-plugin
```


## Usage

```js
const mongooseCommonPlugin = require('mongoose-common-plugin');
const mongoose = require('mongoose');

const User = new mongoose.Schema({});

User.plugin(mongooseCommonPlugin, { object: 'user' });

module.exports = mongoose.model('User', User);
```


## Options

> Default options shown below:

```js
{
  // *REQUIRED*
  // this should be the name of the model lower-cased (e.g. User)
  // inspired by Stripe's API design (e.g. `"object": "charge"`)
  object: '',

  // whether or not your fields/database design is camelCased
  camelCase: false,

  // whether or not to add virtual getter/setter localization support
  // (super useful for adding Mongoose validation errors that are localized)
  locale: true,

  // whether or not to use `mongoose-omit-common-fields`
  omitCommonFields: true,

  // either an Array or Object
  // these will get added to `mongoose-json-select`
  // and are extra fields you'd like to ignore from toJSON/toObject calls
  // (e.g. `omitExtraFields: [ 'some_field_to_ignore' ]`)
  // note that we automatically add the `-` prefix to keys for Arrays passed
  omitExtraFields: []
}
```


## Localized Error Messages

By default the `options.locale` value is `true`. Therefore you can add localized error messages using [i18n][].

> User model definition:

```js
const i18n = require('i18n');
const mongoose = require('mongoose');
const validator = require('validator');

const User = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    index: true,
    validate: (val, fn) => {
      if (validator.isEmail(val))
        return fn();
      fn(false, i18n.__({
        phrase: 'Invalid email address',
        locale: this.locale
      });
    }
  }
});
```

> Route middleware (assumes you're using something like [@ladjs/i18n][ladjs-i18n]):

```js
try {
  user.locale = ctx.req.locale;
  await user.validate();
} catch (err) {
  // will throw localized validation error message for `user.email`
  return ctx.throw(Boom.badRequest(err));
}
```


## Contributors

| Name           | Website                    |
| -------------- | -------------------------- |
| **Nick Baugh** | <http://niftylettuce.com/> |


## License

[MIT](LICENSE) © [Nick Baugh](http://niftylettuce.com/)


## 

[npm]: https://www.npmjs.com/

[yarn]: https://yarnpkg.com/

[i18n]: https://github.com/mashpie/i18n-node

[ladjs-i18n]: https://github.com/ladjs/i18n
