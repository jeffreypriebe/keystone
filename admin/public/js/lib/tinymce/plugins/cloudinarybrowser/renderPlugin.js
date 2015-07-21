var React = require('react');
var request = require('superagent');

// var CreateForm = require('../components/CreateForm');
// var EditForm = require('../components/EditForm');
// var Header = require('../components/ItemViewHeader');
var Thumbnail = require('../../../../../../../fields/types/cloudinaryimages/CloudinaryImagesField.js');

var View = React.createClass({
	
	displayName: 'PluginView',
	
	getInitialState: function() {
		return {
			// createIsVisible: false,
			// list: Keystone.list,
			props: {
				paths: {}
			},		
			itemData: null
		};
	},

	componentDidMount: function() {
		this.loadItemData();
		//console.log("mounted");
		//this.setState({ props: ["loaded"] });
	},

	loadItemData: function() {
		//request.get('/keystone/api/' + Keystone.list.path + '/' + this.props.itemId + '?drilldown=true')
		request.get('/keystone/api/image-folders/55a88bf1e8853c7838e82dd4?drilldown=true')
			.set('Accept', 'application/json')
			.end((err, res) => {
				if (err || !res.ok || !res.body || !res.body.fields || !res.body.fields['images']) {
					// TODO: nicer error handling
					console.log('Error loading item data:', res ? res.text : err);
					alert('Error loading data (details logged to console)');
					return;
				}				
				this.setState({
					props: { paths: {}, value: res.body.fields['images'] }
				});
			});
	},
	
	// toggleCreate: function(visible) {
	// 	this.setState({
	// 		createIsVisible: visible
	// 	});
	// },
	// 
	// renderCreateForm: function() {
	// 	if (!this.state.createIsVisible) return null;
	// 	return <CreateForm list={Keystone.list} animate onCancel={this.toggleCreate.bind(this, false)} />;
	// },
	renderThumbnails: function() {
		return React.createElement(Thumbnail, this.state.props);
	},
	
	render: function() {
		//CloudinaryImages is setup to have data on load, so don't render it until we have data
		if(!this.state.props.value) return <div><p>Loading&#8230;</p></div>;
		return (
			<div>
			{this.renderThumbnails()}
			</div>
		);		
			// <div>
			// 
			// </div>
				//<Thumbnail paths="{}" />
		// {this.renderCreateForm()}
		// <Header list={this.state.list} data={this.state.itemData} toggleCreate={this.toggleCreate} />
		// <EditForm list={this.state.list} data={this.state.itemData} />
	}
	
});

React.render(<View />, document.getElementById('plugin-view'));
