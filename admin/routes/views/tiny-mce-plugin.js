var keystone = require('../../../'),
	_ = require('underscore'),
	async = require('async');

exports = module.exports = function(req, res) {
	var appName = keystone.get('name') || 'Keystone';
	
	var args = {
		page: 'tiny-mce-plugin',
		title: appName + ': tiny MCE plugin: ' + req.params.plugin,
		plugin: req.params.plugin
	};
	
	for (var key in req.query) {
		if (req.query.hasOwnProperty(key))
			args[key] = req.query[key];
	}
	
	keystone.render(req, res, 'tiny-mce-plugin', args);
};