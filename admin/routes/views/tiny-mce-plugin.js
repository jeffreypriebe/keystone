var keystone = require('../../../'),
	_ = require('underscore'),
	async = require('async');

exports = module.exports = function(req, res) {
	var appName = keystone.get('name') || 'Keystone';
	
	keystone.render(req, res, 'tiny-mce-plugin', {
		page: 'tiny-mce-plugin',
		title: appName + ': tiny MCE plugin: ' + req.params.plugin,
		plugin: req.params.plugin
	});
};