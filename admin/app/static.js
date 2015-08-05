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
var minify = require('express-minify');
var router = express.Router();
var _ = require('underscore');

/* Browersify all Tiny-MCE React-based plugins */

var mapPlugin = function(file, pluckNameReg) {
	var nameMatch = pluckNameReg.exec(file);
	if (!nameMatch) throw new Error('Unexpected name format for TinyMCE plugin ' + file); 
	return {
		file: path.relative(__dirname, file).replace(/\\/g, '/'),
		fileRoot: '/' + path.relative(__dirname + '/../', file).replace(/\\/g, '/'),
		path: nameMatch[1],
		pathRoot: '/' + path.relative(__dirname + '/../', nameMatch[1]).replace(/\\/g, '/'),
		pathRootNoPublic: path.normalize('/' + path.relative(__dirname + '/../', nameMatch[1]).replace('public' + path.sep, '')).replace(/\\/g, '/'),
		name: nameMatch[2],
		filename: nameMatch[3]
	};
};

var basePluginFolder = '/../public/js/lib/tinymce/plugins/';
var pluckReactPluginName = /(.*tinymce\/plugins\/([^\/]+)\/)(renderPlugin)\.js$/i;
var tinyReactPlugins = glob.sync(__dirname + basePluginFolder + '**/renderPlugin.js')
	.map(function(file) { return mapPlugin(file, pluckReactPluginName); });

/* Browserify all Tiny-MCE plugins - plugin js vs. any React-based renderPlugin js */
var pluckPluginName = /(.*tinymce\/plugins\/([^\/]+)\/)([^\.]+)\.js$/i;
var tinyPlugins = glob.sync(__dirname + basePluginFolder + '**/plugin.js')
	.map(function(file) { return mapPlugin(file, pluckPluginName); });

// var allTinyPlugins = tinyPlugins.slice();
// Array.prototype.push.apply(allTinyPlugins, tinyReactPlugins);

/* Prepare browserify bundles */

var bundles = {
	fields: browserify('fields.js', 'FieldTypes'),
	home: browserify('views/home.js'),
	item: browserify('views/item.js'),
	list: browserify('views/list.js')	
};
tinyReactPlugins.forEach(function(p) { bundles[p.name] = browserify(p.file); });

router.prebuild = function() {
	bundles.fields.build();
	bundles.home.build();
	bundles.item.build();
	bundles.list.build();
};
tinyReactPlugins.forEach(function(p) { router.prebuild[p.name] = bundles[p.name].build(); });


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
/* TinyMCE plugin Skins */
router.use('/js/lib/tinymce/skins', less(__dirname + '/../public/js/lib/tinymce/skins', lessOptions));
router.use('/js/lib/tinymce/skins/', express.static(__dirname + '/../public/js/lib/tinymce/skins'));
router.use('/styles/elemental', less(__dirname + '/../../node_modules/elemental/less', lessOptions));
router.use('/styles/elemental/', express.static(__dirname + '/../../node_modules/elemental/less'));
router.get('/js/fields.js', bundles.fields.serve);
router.get('/js/home.js', bundles.home.serve);
router.get('/js/item.js', bundles.item.serve);
router.get('/js/list.js', bundles.list.serve);
tinyPlugins.forEach(function(p) {
	if (p.name !== 'cloudinarybrowser') {
		router.get(p.pathRootNoPublic + '/', minify());
		router.use(p.pathRootNoPublic + '/' + p.filename + '.min.js', express.static(path.resolve(__dirname + '/' + p.file)));
	} else {
		//cloudinarybrowser functions as two plugins
		router.get(p.pathRootNoPublic + 'images/', minify());
		router.use(p.pathRootNoPublic + 'images/' + p.filename + '.min.js', express.static(path.resolve(__dirname + '/' + p.file)));
		router.get(p.pathRootNoPublic + 'files/', minify());
		router.use(p.pathRootNoPublic + 'files/' + p.filename + '.min.js', express.static(path.resolve(__dirname + '/' + p.file)));		
	}
});
tinyReactPlugins.forEach(function(p) {
	router.get('/js/tiny-mce-plugins/' + p.name + '.js', bundles[p.name].serve);
	router.use('/styles/tiny-mce-plugins/' + p.name, less(p.path, lessOptions));
});
router.use('/styles/tiny-mce-plugins/', express.static(__dirname + basePluginFolder));

module.exports = router;
