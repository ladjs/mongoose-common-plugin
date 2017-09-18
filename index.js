const jsonSelect = require('mongoose-json-select');
const beautifulValidation = require('mongoose-beautiful-unique-validation');
const validationErrorTransform = require('mongoose-validation-error-transform');
const mongooseOmitCommonFields = require('mongoose-omit-common-fields');
const isArray = require('lodash.isarray');
const isObject = require('lodash.isobject');

const mongooseCommonPlugin = (schema, options = {}) => {
  options = Object.assign(
    {
      object: '',
      camelCase: false,
      locale: true,
      omitCommonFields: true,
      omitExtraFields: []
    },
    options
  );

  const { camelCase, locale, omitCommonFields, omitExtraFields } = options;

  if (typeof options.object !== 'string' || options.object.trim() === '')
    throw new Error(
      "You must define an `object` name (e.g. `{ object: 'user' }`)"
    );

  schema.add({
    id: {
      type: String,
      index: true,
      unique: true
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

  if (isArray(omitExtraFields)) {
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
  } else if (isObject(omitExtraFields)) {
    select = omitExtraFields;
    console.log('select', select);
    if (omitCommonFields) Object.assign(select, field.obj);
    console.log('object assign', field.obj);
    console.log('select now', select);
  } else if (omitCommonFields) {
    select = field.str;
  }

  console.log('select', select);

  schema.set(
    'toJSON',
    Object.assign(
      {
        getters: true,
        versionKey: false,
        select
      },
      schema.options.toJSON
    )
  );

  schema.set('timestamps', {
    createdAt: camelCase ? 'createdAt' : 'created_at',
    updatedAt: camelCase ? 'updatedAt' : 'updated_at'
  });

  schema.plugin(jsonSelect);
  schema.plugin(beautifulValidation);
  schema.plugin(validationErrorTransform);

  return schema;
};

module.exports = mongooseCommonPlugin;
