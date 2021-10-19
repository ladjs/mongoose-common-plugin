const test = require('ava');
const sinon = require('sinon');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const mongooseCommonPlugin = require('..');

const mongooseOpts = {
  autoReconnect: true,
  reconnectTries: Number.MAX_VALUE,
  reconnectInterval: 1000
};

test.before(async () => {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri, mongooseOpts);

  mongoose.connection.on('error', async e => {
    if (e.message.code === 'ETIMEDOUT') {
      console.log(e);
      await mongoose.connect(uri, mongooseOpts);
    }

    console.log(e);
  });

  mongoose.connection.once('open', () => {
    console.log(`MongoDB successfully connected to ${uri}`);
  });
});

const BlogPost = new mongoose.Schema({
  title: { type: String, required: true }
});
BlogPost.plugin(mongooseCommonPlugin, { object: 'blog_post' });
const BlogPosts = mongoose.model('BlogPost', BlogPost);

test('returns function', t => {
  t.true(typeof mongooseCommonPlugin === 'function');
});

test('creates document', async t => {
  const blogPost = await BlogPosts.create({ title: 'creates document' });

  t.is(typeof blogPost, 'object');
  blogPost.locale = 'en';
  t.is(blogPost.locale, 'en');
});

test('errors if object is not string', t => {
  const Schema = new mongoose.Schema({ title: String });
  t.throws(() => Schema.plugin(mongooseCommonPlugin, { object: 45 }), {
    message: "You must define an `object` name (e.g. `{ object: 'user' }`)"
  });
});

test('omits extra fields', async t => {
  const Schema = new mongoose.Schema({
    title: String,
    test: String
  });
  Schema.plugin(mongooseCommonPlugin, {
    object: 'extra_fields',
    omitExtraFields: ['test', '-hide']
  });
  const Models = mongoose.model('ExtraFields', Schema);

  const model = await Models.create({
    title: 'extra fields',
    test: 'test'
  });

  const obj = model.toObject();
  t.is(typeof obj.test, 'undefined');
  t.is(typeof obj.title, 'string');
});

test.serial('omitExtraFields as object', async t => {
  const omitExtraFields = {
    title: false,
    test: false
  };

  const hasOwnProperty = sinon.stub(Object.prototype, 'hasOwnProperty');
  hasOwnProperty
    .withArgs('title')
    .onFirstCall()
    .returns(false);
  hasOwnProperty
    .withArgs('password')
    .onFirstCall()
    .returns(false);
  hasOwnProperty.callThrough();

  const Schema = new mongoose.Schema({
    title: String,
    test: String,
    password: String
  });
  Schema.plugin(mongooseCommonPlugin, {
    object: 'extra_fields_object',
    omitExtraFields
  });
  const Models = mongoose.model('ExtraFieldsObject', Schema);

  const model = await Models.create({
    title: 'extra fields object',
    test: 'test',
    password: 'pass'
  });

  const obj = model.toObject();
  t.is(typeof obj.test, 'undefined');
  t.is(typeof obj.password, 'string');
  t.is(typeof obj.title, 'string');

  sinon.restore();
});

test.serial('omitExtraFields as object and no commmon fields', async t => {
  const omitExtraFields = {
    title: false,
    test: false
  };

  const hasOwnProperty = sinon.stub(Object.prototype, 'hasOwnProperty');
  hasOwnProperty
    .withArgs('title')
    .onFirstCall()
    .returns(false);
  hasOwnProperty.callThrough();

  const Schema = new mongoose.Schema({
    title: String,
    test: String,
    password: String
  });
  Schema.plugin(mongooseCommonPlugin, {
    object: 'extra_fields_object_no_common',
    omitCommonFields: false,
    omitExtraFields
  });
  const Models = mongoose.model('ExtraFieldsObjectNoCommon', Schema);

  const model = await Models.create({
    title: 'extra fields object',
    test: 'test',
    password: 'pass'
  });

  const obj = model.toObject();
  t.is(typeof obj.test, 'undefined');
  t.is(typeof obj.password, 'string');
  t.is(typeof obj.title, 'string');

  sinon.restore();
});

test.serial('omitCommonFields', async t => {
  const hasOwnProperty = sinon.stub(Object.prototype, 'hasOwnProperty');
  hasOwnProperty
    .withArgs('password')
    .onFirstCall()
    .returns(false);
  hasOwnProperty.callThrough();

  const Schema = new mongoose.Schema({
    title: String,
    password: String,
    reset_token: String
  });
  Schema.plugin(mongooseCommonPlugin, {
    object: 'omit_common_fileds',
    omitExtraFields: false
  });
  const Models = mongoose.model('OmitCommonFields', Schema);

  const model = await Models.create({
    title: 'omit common fields',
    password: 'blah',
    reset_token: '1234'
  });

  const obj = await model.toJSON();
  t.is(typeof obj.password, 'string');
  t.is(typeof obj.reset_token, 'undefined');
  t.is(typeof obj.title, 'string');

  sinon.restore();
});

test('does not omitCommonFields', async t => {
  const Schema = new mongoose.Schema({
    title: String,
    password: String,
    reset_token: String
  });
  Schema.plugin(mongooseCommonPlugin, {
    object: 'no_omit_common_fields',
    omitExtraFields: false,
    omitCommonFields: false
  });
  const Models = mongoose.model('NoOmitCommonFields', Schema);

  const model = await Models.create({
    title: 'no omit common fields',
    password: 'blah',
    reset_token: '1234'
  });

  const obj = await model.toJSON();
  t.is(typeof obj.password, 'string');
  t.is(typeof obj.reset_token, 'string');
  t.is(typeof obj.title, 'string');
});

test('no locale', async t => {
  BlogPost.plugin(mongooseCommonPlugin, {
    object: 'no_locale',
    locale: false
  });
  const Model = mongoose.model('NoLocale', BlogPost);

  const model = await Model.create({ title: 'no locale' });
  t.is(typeof model.locale, 'undefined');
});

test('camel case', async t => {
  const Schema = new mongoose.Schema({
    title: String,
    password: String,
    resetToken: String
  });
  Schema.plugin(mongooseCommonPlugin, {
    object: 'camel_case',
    omitExtraFields: false,
    camelCase: true
  });
  const Models = mongoose.model('CamelCase', Schema);

  const model = await Models.create({
    title: 'omit common fields',
    password: 'blah',
    resetToken: '1234'
  });

  const obj = await model.toJSON();
  t.is(typeof obj.password, 'undefined');
  t.is(typeof obj.resetToken, 'undefined');
  t.is(typeof obj.title, 'string');
});

test('omits extra fields but not common fields', async t => {
  const Schema = new mongoose.Schema({
    title: String,
    test: String,
    password: String
  });
  Schema.plugin(mongooseCommonPlugin, {
    object: 'extra_fields_no_common',
    omitExtraFields: ['test'],
    omitCommonFields: false
  });
  const Models = mongoose.model('ExtraFieldsNoCommon', Schema);

  const model = await Models.create({
    title: 'extra fields',
    test: 'test',
    password: 'test'
  });

  const obj = model.toObject();
  t.is(typeof obj.test, 'undefined');
  t.is(typeof obj.password, 'string');
  t.is(typeof obj.title, 'string');
});
