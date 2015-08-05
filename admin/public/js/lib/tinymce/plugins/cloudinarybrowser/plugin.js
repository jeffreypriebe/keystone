var pluginTypes = {
	IMAGES: "images",
	FILES: "files"
};
var pluginFunction = function (pluginType) {
	return function (editor, url) {
		
		var pluginOpts = {
			name: "cloudinarybrowser" + pluginType,
			icon: pluginType === pluginTypes.IMAGES ? 'image' : 'browse',
			tooltip: pluginType === pluginTypes.IMAGES ? 'Insert an image' : 'Insert a link to a file',
			title: pluginType === pluginTypes.IMAGES ? 'Browse Images' : 'Browse Files'
		};
	
		//Construct url
		var optsToPass = ['modelName', 'fieldName', 'listPath', 'itemName', 'cloudinaryBrowserImageWidth'];
		var sourceParam = editor.getParam(pluginOpts.name);
		var params = optsToPass.map(function (o) {
			return o + '=' + sourceParam[o];
		}).join('&');
		params += '&mode=' + pluginType;
		var browseUrl = '/keystone/tiny-mce-plugin/cloudinarybrowser?' + params;
	
		//Add close function for our plugin window to callback to.
		window.insertThumbnail = function (imageTag) {
			editor.insertContent(imageTag);
			editor.windowManager.close();
		};

		if (pluginType == pluginTypes.IMAGES) //On image resize, update cloudinary url		
			editor.on('ObjectResized', function (e) {
				var el = $(e.target);

				if (el.attr('src').indexOf('cloudinary.com') === -1) return; //Not a cloudinary image
				
				var id = el.attr('id');
				if (!id) {
					console.log('Found a cloudinary image to resize but it has no id. Can\'t resize.');
					return;
				}

				var cloudinaryUrl = $.cloudinary.url(id, { width: e.width, height: e.height, crop: 'fill' });
				var url = cloudinaryUrl.replace('http:', ''); //protocol relative 
		
		
				var content = editor.getContent();
				content = content.replace(new RegExp("(.*?<img.+?id=[\"']" + id + "[\"'].*?src=[\"'])[^\"']+(\".*)", "gi"), "$1" + url + "$2");
				editor.setContent(content, { format: "raw" });
			});
	
		//Open plugin window
		editor.addButton(pluginOpts.name, {
			icon: pluginOpts.icon,
			tooltip: pluginOpts.tooltip,
			onClick: function () {
				editor.windowManager.open({
					title: pluginOpts.title,
					width: (768 + 2), //768 is the media-query breakpoint for elemental items, 2 is what is lost to plugin window chrome
					height: 360,
					url: browseUrl,
					buttons: [{
						text: "Save", //Save for this is "post files to upload"
						onclick: function (e) {
							var frame = $(e.target).parents(".mce-reset").find("iframe").first();
							frame[0].contentDocument.postThumbnails();
						}
					}, {
							text: "Cancel",
							onclick: "close"
						}]
				})
			}
		});
	};
};
tinymce.PluginManager.add("cloudinarybrowserimages", pluginFunction(pluginTypes.IMAGES));
tinymce.PluginManager.add("cloudinarybrowserfiles", pluginFunction(pluginTypes.FILES));