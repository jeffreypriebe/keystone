var moment = require('moment');
var momentTimezone = require('moment-timezone');
var DateType = require('../date/DateType');
var FieldType = require('../Type');
var util = require('util');

var parseFormats = [moment.ISO_8601, 'YYYY-MM-DD', 'YYYY-MM-DD h:m:s a', 'YYYY-MM-DD h:m a', 'YYYY-MM-DD H:m:s', 'YYYY-MM-DD H:m'];

/**
 * DateTime FieldType Constructor
 * @extends Field
 * @api public
 */
function datetime(list, path, options) {
	this._nativeType = Date;
	this._underscoreMethods = ['format', 'moment', 'parse', 'tz'];
	this._fixedSize = 'large';
	this._properties = ['formatString', 'isUTC'];
	this.typeDescription = 'date and time';
	this.parseFormatString = options.parseFormat || parseFormats;
	this.formatString = (options.format === false) ? false : (options.format || 'YYYY-MM-DD h:mm:ss a');
	this.isUTC = options.utc || options.isUTC || false;
	if (this.formatString && 'string' !== typeof this.formatString) {
		throw new Error('FieldType.DateTime: options.format must be a string.');
	}
	datetime.super_.call(this, list, path, options);
	this.paths = {
		date: this._path.append('_date'),
		time: this._path.append('_time')
	};
}
util.inherits(datetime, FieldType);

/* Inherit from DateType prototype */
datetime.prototype.addFilterToQuery = DateType.prototype.addFilterToQuery;
datetime.prototype.format = DateType.prototype.format;
datetime.prototype.moment = DateType.prototype.moment;
datetime.prototype.parse = DateType.prototype.parse;
datetime.prototype.tz = DateType.prototype.tz;

/**
 * Get the value from a data object; may be simple or a pair of fields
 */
datetime.prototype.getInputFromData = function(data) {
	if (this.paths.date in data && this.paths.time in data) {
		return (data[this.paths.date] + ' ' + data[this.paths.time]).trim();
	} else {
		return data[this.path];
	}
};

/**
 * Gets an attached '_timezone' value
 * Used by DatetimeField to send back what timezone information it was using for correct parsing on the server (which may be in a different timezone)
 */
datetime.prototype.timezoneGuess = function(value, parseFormats, data, defaultMoment) {
    var timezonePath = this.path + '_timezone';
    if (!(timezonePath in data)) return defaultMoment();
    
    var timezoneGuess = data[timezonePath];
    
    return moment.tz(value, parseFormats, timezoneGuess).utc();
};

/**
 * Checks that a valid date has been provided in a data object
 * An empty value clears the stored value and is considered valid
 */
datetime.prototype.validateInput = function(data, required, item) {
	if (!(this.path in data && !(this.paths.date in data && this.paths.time in data)) && item && item.get(this.path)) return true;
	var newValue = moment(this.getInputFromData(data), parseFormats);
	if (required && (!newValue || !newValue.isValid())) {
		return false;
	} else if (this.getInputFromData(data) && newValue && !newValue.isValid()) {
		return false;
	} else {
		return true;
	}
};

/**
 * Updates the value for this field in the item from a data object
 */
datetime.prototype.updateItem = function(item, data) {
	if (!(this.path in data || data[this.path] || (this.paths.date in data && this.paths.time in data))) {
		return;
	}
    
    var rawValue = this.getInputFromData(data);
    var defaultMoment = function() { return moment(rawValue, parseFormats); };
    
    var newValue = this.isUTC ? this.timezoneGuess(rawValue, parseFormats, data, defaultMoment) : defaultMoment();
     
	if (newValue.isValid()) {
		if (!item.get(this.path) || !newValue.isSame(item.get(this.path))) {
			item.set(this.path, newValue.toDate());
		}
	} else if (item.get(this.path)) {
		item.set(this.path, null);
	}
};

/* Export Field Type */
exports = module.exports = datetime;
