var React = require('react');
var request = require('superagent');
var _ = require('underscore');
var InsertModal = require('./insertModal');

var Thumbnail = require('../../../../../../../fields/types/cloudinaryimages/CloudinaryImagesField.js');

var Folder = React.createClass({
	
	displayName: 'CloudinaryFolder',
	
	browseToFolder: function(path, id) {
		this.props.cb(path, id);
	},
	
	render: function() {
		return (
			<div className='folder image-field image-sortable row col-sm-3 col-md-12' title={this.props.name}>
				<a onClick={this.browseToFolder.bind(this, this.props.name, this.props.id)} href="#" className='img-thumbnail'>
					<i className="ion-ios7-folder-outline" />
				</a>

				<div className='image-details'>
					<button type='button' onClick={this.browseToFolder.bind(this, this.props.name, this.props.id)} className='btn btn-link'>{this.props.name}</button>
				</div>
			</div>
		);
	}
});

var View = React.createClass({
	
	displayName: 'PluginView',
	
	getInitialState: function() {
		return {
			folderPath: 'Image Folder 1',//'/',
			folders: [],
			insertModalProps: {
				insertCallback: this.insertThumbnail
			},
			props: {
				canUpload: true,
				allowRemoval: false,
				imageClick: this.thumbnailClicked,
				buttonSuffix: ' to upload',
				paths: {
					action: this.props.fieldName + '_action',
					uploads: this.props.fieldName + '_uploads'
				}
			},
			itemData: null
		};
	},

	componentDidMount: function() {
		document.postThumbnails = this.postThumbnails;
		this.loadData();
	},
	
	componentDidUpdate: function(prevProps, prevState) {
		if(prevState.folderPath !== this.state.folderPath)
			this.loadData();
	},
	
	updateState: function(obj) {
		if(!obj.childFileCount && obj.props && obj.props.value)
			obj.childFileCount = obj.props.value.length;
		
		if(this.isMounted())
			this.setState(_.extend(this.state, obj));
	},
	
	updatePropsState: function(paths, value, canUpload) {
		
		var newProps = _.extend(this.state.props, {
			paths: paths || this.state.props.paths,
			value: value || this.state.props.value,
			canUpload: canUpload !== undefined ? canUpload : this.state.props.canUpload
		});
		
		this.updateState(newProps);
	},
	
	updateValueState: function(value) {
		this.updatePropsState(null, value);
	},
	
	loadData: function() {
		var newCanUpload = true;
		if (!this.state.folderPath || (this.state.folderPath === '/' && !this.state.folderId)) {
			newCanUpload = false;
			this.listAllFolders(); //top-level folder
		} else if (!this.state.folderId) {
			this.loadFolderFromPath(); //first load only, really
		} else {
			this.loadFolderData(this.state.folderId); //loading a folder that user clicked on
		}
		this.updatePropsState(null, null, newCanUpload);
	},
	
	listAllFolders: function() {
		request.get('/keystone/api/image-folders/autocomplete')
			.set('Accept', 'application/json')
			.end((err, res) => {
				if(err || !res.ok || !res.body) {
					// TODO: nicer error handling
					console.log('Error loading item data:', res ? res.text : err);
					alert('Error loading data (details logged to console)');
					return;
				}
				if (!res.body.items) return; //Empty, that's allowed
				
				this.updateValueState([]); //Empty images
				this.setState({
					folders: res.body.items
				});
			});
	},

	loadFolderFromPath: function() {
		request.get('/keystone/api/' + this.props.modelName + '/autocomplete?q=' + this.state.folderPath)
			.set('Accept', 'application/json')
			.end((err, res) => {
				if (err || !res.ok || !res.body) {
					// TODO: nicer error handling
					console.log('Error loading item data:', res ? res.text : err);
					alert('Error loading data (details logged to console)');
					return;
				}
				
				if(!res.body.items || res.body.total === 0) {
					this.updateValueState([]);
					return; //Folder not found
				}
				
				var Folder = res.body.items[0];			
				
				this.setState(_.extend(this.state, { folderId: Folder.id }));
				this.loadFolderData(Folder.id);
			});
	},
	
	loadFolderData: function(id) {
		request.get('/keystone/api/' + this.props.modelName + '/' + id)
			.set('Accept', 'application/json')
			.end((err, res) => {
				if(err || !res.ok || !res.body) {
					// TODO: nicer error handling
					console.log('Error loading item data:', res ? res.text : err);
					alert('Error loading data (details logged to console)');
					return;
				}
				
				if(!res.body.fields[this.props.fieldName]) {
					this.updateValueState([]);
					return; //Folder doesn't have any images
				}
						
				this.updateValueState(res.body.fields[this.props.fieldName]);
			});		
	},
	
	changeFolder: function(path, id) {
		var newPath = {
			folderPath: path || '',
			folderId: id,
			folders: []
		};
		this.setState(newPath);
	},
	
	browseUp: function() {
		this.setState({ folderPath: '/', folderId: null }); //Single level of foldering, so "up" is always, return to root
	},
	
	insertThumbnail: function(imageTag) {
		//look for parent window and callback property to return the new thumbnail to 
		if(window.parent && window.parent.insertThumbnail && typeof window.parent.insertThumbnail === 'function') {
			window.parent.insertThumbnail(imageTag)
		} else {
			console.log('Error finding parent function, would have inserted: [next line]');
			console.log(imageTag);
		}	
	},
	
	thumbnailClicked: function(thumb, e) {
		this.refs.insertModal.show(thumb.props);
	},
	
	thumbnailUpdate: function(prevProps, props, prevState, state) {
		//thumbnail manages itself on the state.thumbnails - but we have only the props.value that we passed in, that's why we are comparing to see if these changes
		if(state.thumbnails.length !== this.state.childFileCount)
			this.setState(_.extend(this.state, { childFileCount: state.thumbnails.length }))
	},
	
	postThumbnails: function(e) {
		if (e) e.preventDefault();
		
		var thumbnails = this.refs.thumbnails;
		var thumbsToUpload = thumbnails.state.thumbnails.
				filter(t => t.props.isQueued);	//Only new, queued files
		var newThumbs = thumbsToUpload.
				map(t => {
					var d = t.props.url;
					return {
						data: d.substring(d.indexOf('base64,') + 7),
						filename: t.props.filename,
						size: t.props.size,
						type: t.props.type
					}
				});
		
		var postObj = {
			action: 'updateItem',
			csrf_query: Keystone.csrf_query,
			q: Keystone.query
		};
		postObj[this.props.fieldName + '_upload'] = JSON.stringify(newThumbs);
		
		var postData = Keystone.csrf(postObj);
		var req = request.post('/keystone/' + this.props.modelName + '/' + this.state.folderId)
			.set('Accept', 'application/json')
			.type('form')
			.send(postData)
			.end((err, res) => {
				if(err || !res.ok) {
					// TODO: nicer error handling
					console.log('Error posting item data update:', res ? res.text : err);
					alert('Error posting data (details logged to console)');
					return;
				}
				
				//Upload successful, keep them around (dequeue and clear the file upload field);
				thumbsToUpload.forEach(t => thumbnails.markUploaded(t.key));
				thumbnails.clearFiles();
			});
	},
	
	renderFolderPath: function() {
		return (
			<div className="browse">
				<div className="up"><button role="presentation" className="btn btn-default btn-xs" type="button" title="Browse up a level" aria-label="Browse up a level" onClick={this.browseUp}><i className="ion-arrow-up-c" /></button></div> 
				<div className="folderPath"><i className="ion-ios7-folder-outline" /> {this.state.folderPath}</div>
			</div>
		);
	},
	
	renderFolders: function() {
		return (
			<div className="folders">
				{this.state.folders.map(f => {
					return (<Folder name={f.name} id={f.id} cb={this.changeFolder} />);
				})}
			</div>
		);
	},
	
	renderThumbnails: function() {
		return React.createElement(Thumbnail, _.extend(this.state.props, { ref: 'thumbnails', cb: this.thumbnailUpdate }));
	},
	
	renderEmptySpacer: function() {
		if (_.isEmpty(this.state.folders) && this.state.childFileCount === 0) // _.isEmpty(this.state.props.value))
			return <div className="folders folders-empty" />	
	},
	
	render: function() {
		if(!this.state.props.value) return <div><p>Loading&#8230;</p></div>;
		return (
			<div>
			{this.renderFolderPath()}
			{this.renderFolders()}
			{this.renderEmptySpacer()}
			<form onSubmit={this.postThumbnails} encType="multipart/form-data">
				{this.renderThumbnails()}
			</form>
			<InsertModal ref='insertModal' {...this.state.insertModalProps} />
			</div>
		);
	}
	
});

var pluginEl = document.getElementById('plugin-view');
var modelName = pluginEl.getAttribute('modelName');
var fieldName = pluginEl.getAttribute('fieldName');
var listPath = pluginEl.getAttribute('listPath');
var itemName = pluginEl.getAttribute('itemName');
React.render(<View modelName={modelName} fieldName={fieldName} listPath={listPath} itemName={itemName} />, pluginEl);
