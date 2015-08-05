var _ = require('underscore'),
	bytes = require('bytes'),
	React = require('react'),
	Field = require('../Field'),
	moment = require('moment');

var ICON_EXTS = [
	'aac', 'ai', 'aiff', 'avi', 'bmp', 'c', 'cpp', 'css', 'dat', 'dmg', 'doc', 'dotx', 'dwg', 'dxf', 'eps', 'exe', 'flv', 'gif', 'h',
	'hpp', 'html', 'ics', 'iso', 'java', 'jpg', 'js', 'key', 'less', 'mid', 'mp3', 'mp4', 'mpg', 'odf', 'ods', 'odt', 'otp', 'ots',
	'ott', 'pdf', 'php', 'png', 'ppt', 'psd', 'py', 'qt', 'rar', 'rb', 'rtf', 'sass', 'scss', 'sql', 'tga', 'tgz', 'tiff', 'txt',
	'wav', 'xls', 'xlsx', 'xml', 'yml', 'zip'
];

var Item = React.createClass({
	
	render: function () {
		var filename = this.props.filename;
		var ext = filename.split('.').pop();

		var iconName = '_blank';
		if (_.contains(ICON_EXTS, ext)) iconName = ext;

		var body = [];

		body.push(<img className='file-icon' src={'/keystone/images/icons/32/' + iconName + '.png'} />);
		body.push(<span className='file-filename'>{filename}</span>);			

		if (this.props.size) {
			body.push(<span className='file-size'>{bytes(this.props.size)}</span>);
		}
		
		if (this.props.modified) {
			var dt = moment(this.props.modified);
			body.push(<span className='file-modified-date' title={dt.format()}>{dt.from(Date.now())}</span>);
		}

		if (this.props.deleted) {
			body.push(<span className='file-note-delete'>save to delete</span>);
		} else if (this.props.isQueued) {
			body.push(<span className='file-note-upload'>save to upload</span>);
		}

		if (!this.props.isQueued && (this.props.allowRemoval || this.props.allowRemoval === undefined)) {
			var actionLabel = this.props.deleted ? 'undo' : 'remove';
			body.push(<span className='file-action' onClick={this.props.toggleDelete}>{actionLabel}</span>);
		}

		var itemClassName = 'file-item';
		if (this.props.deleted) itemClassName += ' file-item-deleted';
		
		if (!this.props.imageClick || this.props.isQueued) {
			return <div className={itemClassName} key={this.props.key}>{body}</div>;
		} else {
			var self = this;
			return (
				<a href='#' onClick={this.props.imageClick.bind(this, self)} className='file-item-click' title={'Insert ' + filename.replace('\'', '')}>
					<div className={itemClassName} key={this.props.key}>{body}</div>
				</a>
			);
		}
	}
	
});

module.exports = Field.create({

	getInitialState: function () {
		var items = this.processItems(this.props.value);

		return { items: items };
	},
	
	/*eslint-disable */
	componentWillUpdate: function(nextProps, nextState) {
	/*eslint-enable */
		if(nextProps.value !== this.props.value) {
			var items = this.processItems(nextProps.value);
			this.setState(_.extend(this.state, { items: items }));
		}
	},
	
	componentDidUpdate: function(prevProps, prevState) {
		if (this.props.cb && typeof this.props.cb === 'function') {
			this.props.cb(prevProps, this.props, prevState, this.state);
		}
	},
	
	processItems: function(items) {
		var self = this;
		var newItems = [];
		
		_.each(items, function (item) {
			self.pushItem(item, newItems);
		});

		return newItems;		
	},

	removeItem: function (i) {
		var thumbs = this.state.items;
		var thumb = thumbs[i];

		if (thumb.props.isQueued) {
			thumbs[i] = null;
		} else {
			thumb.props.deleted = !thumb.props.deleted;
		}

		this.setState({ items: thumbs });
	},

	pushItem: function (args, thumbs) {
		thumbs = thumbs || this.state.items;
		var i = thumbs.length;
		args.toggleDelete = this.removeItem.bind(this, i);
		var allowRemoval = this.props.allowRemoval === null ? true : this.props.allowRemoval;
		thumbs.push(<Item key={i} allowRemoval={allowRemoval} imageClick={this.props.imageClick} {...args} />);
	},

	fileFieldNode: function () {
		return this.refs.fileField.getDOMNode();
	},

	renderFileField: function () {
		return <input ref='fileField' type='file' name={this.props.paths.upload} multiple className='field-upload' onChange={this.uploadFile} />;
	},

	clearFiles: function () {
		this.fileFieldNode().value = '';

		this.setState({
			items: this.state.items.filter(function (thumb) {
				return !thumb.props.isQueued;
			})
		});
	},
	
	markUploaded: function(key, item_id) {
		var thumbnails = this.state.items;
		thumbnails[key].props.isQueued = false;
		thumbnails[key].props._id = item_id;
		this.setState(_.extend(this.state, {
			items: thumbnails
		}));
	},

	uploadFile: function (event) {
		var self = this;

		var files = event.target.files;
		
		_.each(files, function (f) {
			if (!self.props.gatherFileData || !window.FileReader) {			
				self.pushItem({ isQueued: true, filename: f.name });
				self.forceUpdate();
			} else {
				var fileReader = new FileReader();
				fileReader.onloadend = function(e) {
					self.pushItem({
						isQueued: true,
						filename: f.name,
						originalname: f.name,
						mimetype: f.type,
						size: f.size,
						url: e.target.result						
					});
					self.forceUpdate();
				};
				fileReader.readAsDataURL(f);
			}
		});
	},

	changeFiles: function () {
		this.fileFieldNode().click();
	},

	hasFiles: function () {
		return this.refs.fileField && this.fileFieldNode().value;
	},

	renderToolbar: function () {		
		if(this.props.canUpload === false) return;
		
		var clearFilesButton;
		if (this.hasFiles()) {
			clearFilesButton = <button type='button' className='btn btn-default btn-upload' onClick={this.clearFiles}>Clear uploads</button>;
		}

		return (
			<div className='files-toolbar row col-sm-3 col-md-12'>
				<div className='pull-left'>
					<button type='button' className='btn btn-default btn-upload' onClick={this.changeFiles}>Upload</button>
					{clearFilesButton}
				</div>
			</div>
		);
	},

	renderPlaceholder: function () {
		return (
			<div className='file-field file-upload row col-sm-3 col-md-12' onClick={this.changeFiles}>
				<div className='file-preview'>
					<span className='file-thumbnail'>
						<span className='file-dropzone' />
						<div className='ion-picture file-uploading' />
					</span>
				</div>

				<div className='file-details'>
					<span className='file-message'>Click to upload</span>
				</div>
			</div>
		);
	},

	renderContainer: function () {
		return ( 
			<div className='files-container clearfix'>
				{this.state.items}
			</div>
		);
	},

	renderFieldAction: function () {
		var value = '';
		var remove = [];
		_.each(this.state.items, function (thumb) {
			if (thumb && thumb.props.deleted) remove.push(thumb.props._id);
		});
		if (remove.length) value = 'delete:' + remove.join(',');

		return <input ref="action" className="field-action" type="hidden" value={value} name={this.props.paths.action} />;
	},

	renderUploadsField: function () {		
		return <input ref="uploads" className="field-uploads" type="hidden" name={this.props.paths.uploads} />;
	},

	renderUI: function () {
		return (
			<div className="field field-type-files">
				<label className="field-label">{this.props.label}</label>

				{this.renderFieldAction()}
				{this.renderUploadsField()}
				{this.renderFileField()}

				<div className="field-ui">
					{this.renderContainer()}
					{this.renderToolbar()}
				</div>
			</div>
		);
	}
});
