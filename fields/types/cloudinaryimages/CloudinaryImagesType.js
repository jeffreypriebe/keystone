/*!
 * Module dependencies.
 */

var _ = require('underscore'),
	keystone = require('../../../'),
	util = require('util'),
	cloudinary = require('cloudinary'),
	utils = require('keystone-utils'),
	super_ = require('../Type'),
	async = require('async'),
	Stream = require('stream'),
	base64Stream = require('base64-stream');

/**
 * CloudinaryImages FieldType Constructor
 * @extends Field
 * @api public
 */

function cloudinaryimages(list, path, options) {

	this._underscoreMethods = ['format'];
	this._fixedSize = 'full';
	this._properties = ['select', 'selectPrefix', 'autoCleanup', 'publicID', 'folder', 'filenameAsPublicID'];

	// TODO: implement filtering, usage disabled for now
	options.nofilter = true;
	// TODO: implement initial form, usage disabled for now
	if (options.initial) {
		throw new Error('Invalid Configuration\n\n' +
			'CloudinaryImages fields (' + list.key + '.' + path + ') do not currently support being used as initial fields.\n');
	}

	cloudinaryimages.super_.call(this, list, path, options);
	
	this.autoCleanup = options.autoCleanup || false;
	this.folder = options.folder || undefined;
	this._properties = ['autoCleanup', 'folder'];

	// validate cloudinary config
	if (!keystone.get('cloudinary config')) {
		throw new Error('Invalid Configuration\n\n' +
			'CloudinaryImages fields (' + list.key + '.' + this.path + ') require the "cloudinary config" option to be set.\n\n' +
			'See http://keystonejs.com/docs/configuration/#services-cloudinary for more information.\n');
	}

}

/*!
 * Inherit from Field
 */

util.inherits(cloudinaryimages, super_);


/**
 * Registers the field on the List's Mongoose Schema.
 *
 * @api public
 */

cloudinaryimages.prototype.addToSchema = function() {

	var mongoose = keystone.mongoose;

	var field = this,
		schema = this.list.schema;
	
	this.paths = {
		// virtuals
		folder: 		this._path.append('.folder'),
		// form paths
		upload: 		this._path.append('_upload'),
		uploads: 		this._path.append('_uploads'),
		action: 		this._path.append('_action'),
		order: 			this._path.append('_order')
	};

	var ImageSchema = new mongoose.Schema({
		public_id:		String,
		version:		Number,
		signature:		String,
		format:			String,
		resource_type:	String,
		url:			String,
		width:			Number,
		height:			Number,
		secure_url:		String,
<<<<<<< HEAD
		originalname:	String,
		mimetype:		String,
		size:			Number
=======
		filename:		String,
		type:			String
>>>>>>> Added filename and type to Model.
	});

	// Generate cloudinary folder used to upload/select images
	var folder = function(item) {//eslint-disable-line no-unused-vars
		var folderValue = '';

		if (keystone.get('cloudinary folders')) {
			if (field.options.folder) {
				folderValue = field.options.folder;
			} else {
				var folderList = keystone.get('cloudinary prefix') ? [keystone.get('cloudinary prefix')] : [];
				folderList.push(field.list.path);
				folderList.push(field.path);
				folderValue = folderList.join('/');
			}
		}

		return folderValue;
	};

	// The .folder virtual returns the cloudinary folder used to upload/select images
	schema.virtual(field.paths.folder).get(function() {
		return folder(this);
	});

	var src = function(img, options) {
		if (keystone.get('cloudinary secure')) {
			options = options || {};
			options.secure = true;
		}
		return img.public_id ? cloudinary.url(img.public_id + '.' + img.format, options) : '';
	};

	var addSize = function(options, width, height) {
		if (width) options.width = width;
		if (height) options.height = height;
		return options;
	};

	ImageSchema.method('src', function(options) {
		return src(this, options);
	});

	ImageSchema.method('scale', function(width, height) {
		return src(this, addSize({ crop: 'scale' }, width, height));
	});

	ImageSchema.method('fill', function(width, height) {
		return src(this, addSize({ crop: 'fill', gravity: 'faces' }, width, height));
	});

	ImageSchema.method('lfill', function(width, height) {
		return src(this, addSize({ crop: 'lfill', gravity: 'faces' }, width, height));
	});

	ImageSchema.method('fit', function(width, height) {
		return src(this, addSize({ crop: 'fit' }, width, height));
	});

	ImageSchema.method('limit', function(width, height) {
		return src(this, addSize({ crop: 'limit' }, width, height));
	});

	ImageSchema.method('pad', function(width, height) {
		return src(this, addSize({ crop: 'pad' }, width, height));
	});

	ImageSchema.method('lpad', function(width, height) {
		return src(this, addSize({ crop: 'lpad' }, width, height));
	});

	ImageSchema.method('crop', function(width, height) {
		return src(this, addSize({ crop: 'crop', gravity: 'faces' }, width, height));
	});

	ImageSchema.method('thumbnail', function(width, height) {
		return src(this, addSize({ crop: 'thumb', gravity: 'faces' }, width, height));
	});

	schema.add(this._path.addTo({}, [ImageSchema]));

	this.removeImage = function(item, id, method, callback) {
		var images = item.get(field.path);
		if ('number' !== typeof id) {
			for (var i = 0; i < images.length; i++) {
				if (images[i].public_id === id) {
					id = i;
					break;
				}
			}
		}
		var img = images[id];
		if (!img) return;
		if (method === 'delete') {
			cloudinary.uploader.destroy(img.public_id, function() {});
		}
		images.splice(id, 1);
		if (callback) {
			item.save(('function' !== typeof callback) ? callback : undefined);
		}
	};

	this.underscoreMethod('remove', function(id, callback) {
		field.removeImage(this, id, 'remove', callback);
	});

	this.underscoreMethod('delete', function(id, callback) {
		field.removeImage(this, id, 'delete', callback);
	});

	this.bindUnderscoreMethods();
};


/**
 * Formats the field value
 *
 * @api public
 */

cloudinaryimages.prototype.format = function(item) {
	return _.map(item.get(this.path), function(img) {
		return img.src();
	}).join(', ');
};


/**
 * Detects whether the field has been modified
 *
 * @api public
 */

cloudinaryimages.prototype.isModified = function(item) {//eslint-disable-line no-unused-vars
	// TODO - how should this be detected?
	return true;
};


/**
 * Validates that a value for this field has been provided in a data object
 *
 * @api public
 */

cloudinaryimages.prototype.validateInput = function(data) {//eslint-disable-line no-unused-vars
	// TODO - how should image field input be validated?
	return true;
};


/**
 * Updates the value for this field in the item from a data object
 *
 * @api public
 */

cloudinaryimages.prototype.updateItem = function(item, data) {//eslint-disable-line no-unused-vars
	// TODO - direct updating of data (not via upload)
};


/**
 * Returns a callback that handles a standard form submission for the field
 *
 * Expected form parts are
 * - `field.paths.action` in `req.body` in syntax `delete:public_id,public_id|remove:public_id,public_id`
 * - `field.paths.upload` in `req.files` (uploads the images to cloudinary)
 *
 * @api public
 */

cloudinaryimages.prototype.getRequestHandler = function(item, req, paths, callback) {

	var field = this;

	if (utils.isFunction(paths)) {
		callback = paths;
		paths = field.paths;
	} else if (!paths) {
		paths = field.paths;
	}

	callback = callback || function() {};

	return function() {

		// Order
		if (req.body[paths.order]) {
			var images = item.get(field.path),
				newOrder = req.body[paths.order].split(',');

			images.sort(function(a, b) {
				return (newOrder.indexOf(a.public_id) > newOrder.indexOf(b.public_id)) ? 1 : -1;
			});
		}

		// Removals & Deletes
		if (req.body && req.body[paths.action]) {
			var actions = req.body[paths.action].split('|');

			actions.forEach(function(action) {
				action = action.split(':');
				var method = action[0],
					ids = action[1];

				if (!method.match(/^(remove|delete)$/) || !ids) return;

				ids.split(',').forEach(function(id) {
					field.removeImage(item, id, method);
				});
			});
		}

		// Upload References (direct uploading)
		if (req.body[paths.uploads]) {
			var uploads = JSON.parse(req.body[paths.uploads]);

			uploads.forEach(function(file) {
				item.get(field.path).push(file);
			});
		}

		// Upload Data (form submissions)
		var filesAt = req.files[paths.upload];
		if (!filesAt && req.body[paths.upload]) filesAt = JSON.parse(req.body[paths.upload]);
		
		if (req.files && filesAt) {
			var files = [].concat(filesAt);

			var tp = keystone.get('cloudinary prefix') || '';

			if (tp.length) {
				tp += '_';
			}

			var uploadOptions = {
				tags: [tp + field.list.path + '_' + field.path, tp + field.list.path + '_' + field.path + '_' + item.id]
			};

			var uploadFolder = [];
			if (keystone.get('cloudinary folders')) {
				uploadFolder.push(item.get(paths.folder));
			}
			
			if (keystone.get('cloudinary folders use item name')) {
				uploadFolder.push(item.get('name'));
			}
			
			if (!_.isEmpty(uploadFolder)) {
				uploadOptions.folder = uploadFolder.join('/');
			}

			if (keystone.get('cloudinary prefix')) {
				uploadOptions.tags.push(keystone.get('cloudinary prefix'));
			}

			if (keystone.get('env') !== 'production') {
				uploadOptions.tags.push(tp + 'dev');
			}


			async.each(files, function(file, next) {

				if (!file.size) return next();

				if (field.options.filenameAsPublicID) {
					uploadOptions.public_id = file.originalname.substring(0, file.originalname.lastIndexOf('.'));
				} 

				if (!file.path && !file.data) return next();
				
				var cloudinaryResultHandler = function(result) {
					if (result.error) {
						return next(result.error);
					} else {
						_.extend(result, {
							originalname: file.originalname,
							mimetype: file.mimetype,
							size: file.size
						});
						item.get(field.path).push(result);
						return next();
					}
				};
				
				if(file.path) {
					cloudinary.uploader.upload(file.path, cloudinaryResultHandler, uploadOptions);
				} else if(file.data) {
					var dataStream = new Stream.Readable();
					dataStream._read = function() {};
					dataStream.push(file.data);
					dataStream.push(null);
					
					var cloudinaryStream = cloudinary.uploader.upload_stream(cloudinaryResultHandler, uploadOptions);
					
					dataStream.pipe(base64Stream.decode()).
						pipe(cloudinaryStream);						
				}

			}, function(err) {
				return callback(err);
			});
		} else {
			return callback();
		}
	};
};


/**
 * Immediately handles a standard form submission for the field (see `getRequestHandler()`)
 *
 * @api public
 */

cloudinaryimages.prototype.handleRequest = function(item, req, paths, callback) {
	this.getRequestHandler(item, req, paths, callback)();
};


/*!
 * Export class
 */

exports = module.exports = cloudinaryimages;
