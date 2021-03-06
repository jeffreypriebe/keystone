var _ = require('underscore'),
	React = require('react'),
	Field = require('../Field');

var SUPPORTED_TYPES = ['image/gif', 'image/png', 'image/jpeg', 'image/bmp', 'image/x-icon', 'application/pdf', 'image/x-tiff', 'image/x-tiff', 'application/postscript', 'image/vnd.adobe.photoshop', 'image/svg+xml'];

var Thumbnail = React.createClass({
	
	displayName: 'CloudinaryImagesField',
	
	render: function() {
		var self = this;
		var iconClassName, imageDetails;

		if (this.props.deleted) {
			iconClassName = 'delete-pending ion-close';
		} else if (this.props.isQueued) {
			iconClassName = 'img-uploading ion-upload';
		}

		var previewClassName = 'image-preview';
		if (this.props.deleted || this.props.isQueued) previewClassName += ' action';

		var title = '';
		var fullWidth = this.props.width;
		var fullHeight = this.props.height;
		if (width && height) title = fullWidth + ' x ' + fullHeight;

		var actionLabel = this.props.deleted ? 'Undo' : 'Remove';

		if (!this.props.isQueued && (this.props.allowRemoval || this.props.allowRemoval === undefined)) {
			imageDetails = (
				<div className='image-details'>
					<button onClick={this.props.toggleDelete} type='button' className='btn btn-link btn-cancel btn-undo-remove'>{actionLabel}</button>
				</div>
			);
		}
		
		var imageUrl = (this.props.isQueued || !this.props.public_id || !$.cloudinary) ?
			this.props.url :
			$.cloudinary.url(this.props.public_id, { height: 90, crop: 'fill' });
		
		var url = !this.props.imageClick ? this.props.url : '#';
		
		var linkClick = this.props.imageClick
			? this.props.imageClick.bind(this, self)
			: null;
		
		var additionalLinkClass = this.props.isQueued ? ' img-thumbnail-uploading' : '';
		
		var height = 90;
		var width = !isNaN(this.props.width) && !isNaN(this.props.height)
			? Math.round(height * (this.props.width / this.props.height))
			: null;	
			
		/*eslint-disable */
		return (
			<div className='image-field image-sortable row col-sm-3 col-md-12' title={title}> 
				<div className={previewClassName}>
					<a href={url} onClick={linkClick} className={'img-thumbnail' + additionalLinkClass}>
						<img height={height} width={width} style={{height: height + 'px'}} className='img-load' src={imageUrl} />
						<span className={iconClassName} />
					</a>
				</div>

				{imageDetails}
			</div>
		);
		/*eslint-enable */
	}
	
});

module.exports = Field.create({

	getInitialState: function() {		
		var thumbnails = this.processThumbnails(this.props.value);

		return { files: [], thumbnails: thumbnails };
	},
	
	/*eslint-disable */
	componentWillUpdate: function(nextProps, nextState) {
	/*eslint-enable */
		if(nextProps.value !== this.props.value) {
			var thumbnails = this.processThumbnails(nextProps.value);
			this.setState(_.extend(this.state, { thumbnails: thumbnails }));
		}		
	},
	
	componentDidUpdate: function(prevProps, prevState) {
		if (this.props.cb && typeof this.props.cb === 'function') {
			this.props.cb(prevProps, this.props, prevState, this.state);
		}
	},
	
	processThumbnails (thumbs) {
		var self = this;
		var thumbnails = [];

		_.each(thumbs, function (item) {
			self.pushThumbnail(item, thumbnails);
		});
		
		return thumbnails;
	},

	removeThumbnail: function (i) {
		var thumbs = this.state.thumbnails;
		var thumb = thumbs[i];

		if (thumb.props.isQueued) {
			thumbs[i] = null;
		} else {
			thumb.props.deleted = !thumb.props.deleted;
		}

		this.setState(_.extend(this.state, { thumbnails: thumbs }));
	},

	pushThumbnail: function (args, thumbs) {
		thumbs = thumbs || this.state.thumbnails;
		var i = thumbs.length;
		args.toggleDelete = this.removeThumbnail.bind(this, i);
		var allowRemoval = this.props.allowRemoval === null ? true : this.props.allowRemoval;
		thumbs.push(<Thumbnail key={i} allowRemoval={allowRemoval} imageClick={this.props.imageClick} {...args} />);
	},

	fileFieldNode: function() {
		return this.refs.fileField.getDOMNode();
	},

	getCount: function (key) {
		var count = 0;

		_.each(this.state.thumbnails, function (thumb) {
			if (thumb && thumb.props[key]) count++;
		});

		return count;
	},

	renderFileField: function() {
		return <input ref='fileField' type='file' name={this.props.paths.upload} multiple className='field-upload' onChange={this.uploadFile} />;
	},

	clearFiles: function() {
		this.fileFieldNode().value = '';

		this.setState(_.extend(this.state, {
			thumbnails: this.state.thumbnails.filter(function (thumb) {
				return !thumb.props.isQueued;
			}) })
		);
	},
	
	markUploaded: function(key, public_id) {
		var thumbnails = this.state.thumbnails;
		thumbnails[key].props.isQueued = false;
		thumbnails[key].props.public_id = public_id;
		this.setState(_.extend(this.state, {
			thumbnails: thumbnails
		}));
	},

	uploadFile: function (event) {
		var self = this;
		
		var files = event.target.files;
		_.each(files, function (f) {
			if (!_.contains(SUPPORTED_TYPES, f.type)) {
				alert('Unsupported file type. Supported formats are: GIF, PNG, JPG, BMP, ICO, PDF, TIFF, EPS, PSD, SVG');
				return;
			}

			if (window.FileReader) {
				var fileReader = new FileReader();
				fileReader.onloadend = function (e) {
					//Read images width & height
					var newImage = new Image();
					newImage.src = e.target.result;
					newImage.onload = function() {					
						self.pushThumbnail({
							isQueued: true,
							width: newImage.width,
							height: newImage.height,
							originalname: f.name,
							mimetype: f.type,
							size: f.size,
							url: e.target.result
						});
						self.forceUpdate();
					};
				};
				fileReader.readAsDataURL(f);
				
			} else {
				self.pushThumbnail({ isQueued: true, url: '#' });
				self.forceUpdate();
			}
		});
		
	},

	changeImage: function() {
		this.fileFieldNode().click();
	},

	hasFiles: function() {
		return this.refs.fileField && this.fileFieldNode().value;
	},

	renderToolbar: function() {
		if(this.props.canUpload === false) return;
		
		var body = [];

		var push = function (queueType, alertType, count, action) {
			if (count <= 0) return;

			var imageText = count === 1 ? 'image' : 'images';

			body.push(<div key={queueType + '-toolbar'} className={queueType + '-queued' + ' pull-left'}>
				<div className={'alert alert-' + alertType}>{count} {imageText} {action} - save to confirm</div>
			</div>);
		};

		push('upload', 'success', this.getCount('isQueued'), 'queued for upload');
		push('delete', 'danger', this.getCount('deleted'), 'removed');

		var clearFilesButton;
		if (this.hasFiles()) {
			clearFilesButton = <button type='button' className='btn btn-default btn-upload' onClick={this.clearFiles}>Clear selection</button>;
		}

		return (
			<div className='images-toolbar row col-sm-3 col-md-12'>
				<div className='pull-left'>
					<button type='button' className='btn btn-default btn-upload' onClick={this.changeImage}>Select files{this.props.buttonSuffix}</button>
					{clearFilesButton}
				</div>
				{body}
			</div>
		);
	},

	renderPlaceholder: function() {
		return (
			<div className='image-field image-upload row col-sm-3 col-md-12' onClick={this.changeImage}>
				<div className='image-preview'>
					<span className='img-thumbnail'>
						<span className='img-dropzone' />
						<div className='ion-picture img-uploading' />
					</span>
				</div>

				<div className='image-details'>
					<span className='image-message'>Click to upload</span>
				</div>
			</div>
		);
	},

	renderContainer: function() {
		return (
			<div className='images-container clearfix'>
				{this.state.thumbnails}
			</div>
		);
	},

	renderFieldAction: function() {
		var value = '';
		var remove = [];
		_.each(this.state.thumbnails, function (thumb) {
			if (thumb && thumb.props.deleted) remove.push(thumb.props.public_id);
		});
		var action = this.props.autoCleanup ? 'delete:' : 'remove:';
		if (remove.length) value = action + remove.join(',');

		return <input ref='action' className='field-action' type='hidden' value={value} name={this.props.paths.action} />;
	},

	renderUploadsField: function() {
		return <input ref='uploads' className='field-uploads' type='hidden' name={this.props.paths.uploads} />;
	},

	renderUI: function() {
		return (
			<div className='field field-type-cloudinaryimages'>
				<label className='field-label'>{this.props.label}</label>

				{this.renderFieldAction()}
				{this.renderUploadsField()}
				{this.renderFileField()}

				<div className='field-ui'>
					{this.renderContainer()}
					{this.renderToolbar()}
				</div>
			</div>
		);
	}
});
