var keystone = require('../../../'),
	_ = require('underscore'),
	async = require('async');

exports = module.exports = function(req, res) {
	var appName = keystone.get('name') || 'Keystone';
	
	keystone.render(req, res, 'tiny-mce-plugin', {
		page: 'tiny-mce-plugin',
		title: appName + ': tiny MCE plugin: ' + req.params.plugin,
		modelName: req.query.modelName,
		listPath: req.query.listPath,
		itemName: req.query.itemName,
		plugin: req.params.plugin
	});
};