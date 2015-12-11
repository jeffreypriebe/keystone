var FieldType = require('../Type');
var TextType = require('../text/TextType');
var util = require('util');

/**
 * URL FieldType Constructor
 * @extends Field
 * @api public
 */
function urlLink(list, path, options) {
	this._nativeType = String;
	this._underscoreMethods = ['format'];
	this._formatUrl = options.format || removeProtocolPrefix;
	urlLink.super_.call(this, list, path, options);
}
util.inherits(urlLink, FieldType);

/* Inherit from TextType prototype */
urlLink.prototype.addFilterToQuery = TextType.prototype.addFilterToQuery;

/**
 * Formats the field value using either a supplied format function or default
 * which strips the leading protocol from the value for simpler display
 */
urlLink.prototype.format = function(item) {
	var url = (item.get(this.path) || '');
	return this._formatUrl(url);
};

/**
 * Remove the protocol prefix from url
 */
function removeProtocolPrefix(url) {
	return url.replace(/^[a-zA-Z]+\:\/\//, '');
}

// TODO: Proper url validation

/* Export Field Type */
exports = module.exports = urlLink;
