const jsonSelect = require('mongoose-json-select');
const mongooseErrorMessages = require('@ladjs/mongoose-error-messages');
const mongooseOmitCommonFields = require('mongoose-omit-common-fields');
const uniqueValidator = require('mongoose-unique-validator');
const validationErrorTransform = require('mongoose-validation-error-transform');
const { boolean } = require('boolean');

const mongooseCommonPlugin = (schema, options = {}) => {
  options = {
    object: '',
    camelCase: false,
    locale: true,
    omitCommonFields: true,
    omitExtraFields: [],
    // <https://github.com/blakehaswell/mongoose-unique-validator>
    uniqueValidator: {
      message: mongooseErrorMessages.general.unique
    },
    // <https://github.com/niftylettuce/mongoose-validation-error-transform>
    validationErrorTransform: {},
    // <https://github.com/nkzawa/mongoose-json-select>
    jsonSelect: {},
    ...options
  };

  const { camelCase, locale, omitCommonFields, omitExtraFields } = options;

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

  if (locale)
    schema
      .virtual('locale')
      .get(function() {
        return this.__locale;
      })
      .set(function(locale) {
        this.__locale = locale;
      });

  schema.pre('save', function(next) {
    this.id = this._id.toString();
    this.object = options.object;
    next();
  });

  let select = '';

  const field =
    mongooseOmitCommonFields[camelCase ? 'camelCased' : 'underscored'];

  if (Array.isArray(omitExtraFields)) {
    select = [];

    if (omitCommonFields) select = select.concat(field.keys);

    select = select
      .concat(omitExtraFields)
      .map(key => {
        key = key.trim();
        if (key.indexOf('-') === 0) return key;
        return `-${key}`;
      })
      .join(' ');
  } else if (
    typeof omitExtraFields === 'object' &&
    !Array.isArray(omitExtraFields)
  ) {
    select = omitExtraFields;
    if (omitCommonFields) Object.assign(select, field.obj);
  } else if (omitCommonFields) {
    select = field.str;
  }

  schema.set('toJSON', {
    getters: true,
    versionKey: false,
    select,
    ...schema.options.toJSON
  });

  schema.set('timestamps', {
    createdAt: camelCase ? 'createdAt' : 'created_at',
    updatedAt: camelCase ? 'updatedAt' : 'updated_at'
  });

  schema.plugin(uniqueValidator, options.uniqueValidator);
  schema.plugin(jsonSelect, options.jsonSelect);
  schema.plugin(validationErrorTransform, options.validationErrorTransform);

  return schema;
};

module.exports = mongooseCommonPlugin;
