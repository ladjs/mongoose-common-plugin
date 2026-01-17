const mongooseErrorMessages = require('@ladjs/mongoose-error-messages');
const mongooseHidden = require('mongoose-hidden')();
const mongooseOmitCommonFields = require('mongoose-omit-common-fields');
const uniqueValidator = require('@ladjs/mongoose-unique-validator');
const validationErrorTransform = require('mongoose-validation-error-transform');
const { boolean } = require('boolean');

const mongooseCommonPlugin = (schema, options = {}) => {
  options = {
    object: '',
    camelCase: false,
    locale: true,
    omitCommonFields: true,
    defaultLocale: 'en',
    omitExtraFields: [],
    // <https://github.com/blakehaswell/mongoose-unique-validator>
    uniqueValidator: {
      message: mongooseErrorMessages.general.unique
    },
    // <https://github.com/niftylettuce/mongoose-validation-error-transform>
    validationErrorTransform: {},
    // <https://github.com/mblarsen/mongoose-hidden>
    mongooseHidden: {},
    uniqueId: true,
    ...options
  };

  if (typeof options.object !== 'string' || options.object.trim() === '')
    throw new Error(
      "You must define an `object` name (e.g. `{ object: 'user' }`)"
    );

  schema.add({
    id: {
      type: String,
      index: true,
      unique: boolean(options.uniqueId)
    },
    object: {
      type: String,
      trim: true
    }
  });

  if (options.locale)
    schema
      .virtual('locale')
      .get(function () {
        return this.__locale || options.defaultLocale;
      })
      .set(function (locale) {
        this.__locale = locale;
      });

  schema.pre('save', function (next) {
    this.id = this._id.toString();
    this.object = options.object;
    next();
  });

  const hidden = {};
  let select = '';

  const field =
    mongooseOmitCommonFields[options.camelCase ? 'camelCased' : 'underscored'];

  if (Array.isArray(options.omitExtraFields)) {
    select = [];

    if (options.omitCommonFields) select = [...select, ...field.keys];

    select = [...select, ...options.omitExtraFields]
      .map((key) => {
        key = key.trim();
        if (key.startsWith('-')) {
          hidden[key.slice(1)] = true;
          return key;
        }

        hidden[key] = true;
        return `-${key}`;
      })
      .join(' ');
  } else if (typeof options.omitExtraFields === 'object') {
    select = options.omitExtraFields;
    for (const prop in options.omitExtraFields) {
      if (Object.prototype.hasOwnProperty.call(options.omitExtraFields, prop))
        hidden[prop] = !boolean(options.omitExtraFields[prop]);
    }

    if (options.omitCommonFields) {
      Object.assign(select, field.obj);
      for (const prop in field.obj) {
        if (Object.prototype.hasOwnProperty.call(field.obj, prop))
          hidden[prop] = !boolean(field.obj[prop]);
      }
    }
  } else if (options.omitCommonFields) {
    select = field.str;
    for (const prop in field.obj) {
      if (Object.prototype.hasOwnProperty.call(field.obj, prop))
        hidden[prop] = !boolean(field.obj[prop]);
    }
  }

  //
  // TODO: we should probably set a few of the props to `select: false`
  // by default (as similar to `passport-local-mongoose` on `hash` and `password`)
  //

  schema.set('toJSON', {
    getters: true,
    virtuals: true,
    ...schema.options.toJSON
  });

  schema.set('toObject', {
    getters: true,
    virtuals: true,
    ...schema.options.toObject
  });

  schema.set('timestamps', {
    createdAt: options.camelCase ? 'createdAt' : 'created_at',
    updatedAt: options.camelCase ? 'updatedAt' : 'updated_at'
  });

  // allow disabling uniqueValidator by passing `uniqueValidator: false`
  if (options.uniqueValidator !== false)
    schema.plugin(uniqueValidator, options.uniqueValidator);
  schema.plugin(mongooseHidden, {
    hidden,
    ...options.mongooseHidden
  });
  schema.plugin(validationErrorTransform, options.validationErrorTransform);

  return schema;
};

module.exports = mongooseCommonPlugin;
