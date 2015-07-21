var React = require('react');
var request = require('superagent');
var _ = require('underscore');

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
			// createIsVisible: false,
			// list: Keystone.list,
			folderPath: this.props.listPath + ': '  + this.props.itemName,
			folders: [],
			props: {
				canUpload: true,
				paths: {}
			},
			itemData: null
		};
	},

	componentDidMount: function() {
		this.loadData();
	},
	
	componentDidUpdate: function(prevProps, prevState) {
		if(prevState.folderPath !== this.state.folderPath)
			this.loadData();
	},
	
	updateState: function(obj) {
		if(this.isMounted())
			this.setState(_.extend(this.state, obj));
	},
	
	updatePropsState: function(paths, values, canUpload) {
		paths = paths || this.state.props.paths;
		values = values || this.state.props.values;
		if(arguments.length < 3)
			canUpload = this.state.props.canUpload;
		
		var newProps = { props: {
			paths: paths,
			value: values,
			canUpload: canUpload
		}};
		
		this.updateState(newProps);
	},
	
	updateValuesState: function(values) {
		this.updatePropsState(null, values);
	},
	
	loadData: function() {
		var newCanUpload = true;
		if (!this.state.folderPath || (this.state.folderPath === '/' && !this.state.folderId)) {
			newCanUpload = false;
			this.listAllFolders(); //top-level
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
				
				this.updateValuesState([]); //Empty images
				this.setState({
					folders: res.body.items
				});
			});
	},

	loadFolderFromPath: function() {
		request.get('/keystone/api/' + this.props.modelName + '/autocomplete?q=' + this.state.folderPath)
			.set('Accept', 'application/json')
			.end((err, res) => {
				if (err || !res.ok || !res.body) {// || !res.body.fields || !res.body.fields['images']) {
					// TODO: nicer error handling
					console.log('Error loading item data:', res ? res.text : err);
					alert('Error loading data (details logged to console)');
					return;
				}
				
				if(!res.body.items || res.body.total === 0) {
					this.updateValuesState([]);
					return; //Folder not found
				}
				
				var Folder = res.body.items[0];			
				
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
				
				if(!res.body.fields['images']) {
					this.updateValuesState([]);
					return; //Folder doesn't have any images
				}
						
				this.updateValuesState(res.body.fields['images']);
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
		return React.createElement(Thumbnail, this.state.props);
	},
	
	renderEmptySpacer: function() {
		if (_.isEmpty(this.state.folders) && _.isEmpty(this.state.props.value))
			return <div className="folders folders-empty" />	
	},
	
	render: function() {
		if(!this.state.props.value) return <div><p>Loading&#8230;</p></div>;
		return (
			<div>
			{this.renderFolderPath()}
			{this.renderFolders()}
			{this.renderEmptySpacer()}
			{this.renderThumbnails()}
			</div>
		);
	}
	
});

var pluginEl = document.getElementById('plugin-view');
var modelName = pluginEl.getAttribute('modelName');
var listPath = pluginEl.getAttribute('listPath');
var itemName = pluginEl.getAttribute('itemName');
React.render(<View modelName={modelName} listPath={listPath} itemName={itemName} />, pluginEl);
