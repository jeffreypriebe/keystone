/**
 * Returns an Express Router with bindings for the Admin UI static resources,
 * i.e files, less and browserified scripts.
 *
 * Should be included before other middleware (e.g. session management,
 * logging, etc) for reduced overhead.
 */

var browserify = require('./browserify');
var express = require('express');
var glob = require('glob');
var less = require('less-middleware');
var path = require('path');
var router = express.Router();

/* Browersify all Tiny-MCE React-based plugins */

var pluckPluginName = /tinymce\/plugins\/([^\/]+)\/renderPlugin.js$/i;
var tinyPlugins = glob.sync(__dirname + '/../public/js/lib/tinymce/plugins/**/renderPlugin.js')
	.map(function(file) {
		var nameMatch = pluckPluginName.exec(file);
		if (!nameMatch) throw new Error('Unexpected name format for TinyMCE plugin ' + file); 
		return {
			file: path.relative(__dirname, file).replace(/\\/g, '/'),
			name: nameMatch[1]
		};
	});

/* Prepare browserify bundles */

var bundles = {
	fields: browserify('fields.js', 'FieldTypes'),
	home: browserify('views/home.js'),
	item: browserify('views/item.js'),
	list: browserify('views/list.js')	
};
tinyPlugins.forEach(function(p) { bundles[p.name] = browserify(p.file); });

router.prebuild = function() {
	bundles.fields.build();
	bundles.home.build();
	bundles.item.build();
	bundles.list.build();
};
tinyPlugins.forEach(function(p) { router.prebuild[p.name] = bundles[p.name].build(); });


/* Prepare LESS options */

var reactSelectPath = path.join(path.dirname(require.resolve('react-select')), '..');

var lessOptions = {
	render: {
		modifyVars: {
			reactSelectPath: JSON.stringify(reactSelectPath)
		}
	}
};

/* Configure router */

router.use('/styles', less(__dirname + '../../public/styles', lessOptions));
router.use(express.static(__dirname + '../../public'));
router.get('/js/fields.js', bundles.fields.serve);
router.get('/js/home.js', bundles.home.serve);
router.get('/js/item.js', bundles.item.serve);
router.get('/js/list.js', bundles.list.serve);
tinyPlugins.forEach(function(p) { router.get('/js/tiny-mce-plugins/' + p.name + '.js', bundles[p.name].serve); });

module.exports = router;
