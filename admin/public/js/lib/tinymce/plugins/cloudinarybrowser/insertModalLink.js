var React = require('react');
var elemental = require('elemental'),
	Button = elemental.Button,
	FormField = elemental.FormField,
	FormInput = elemental.FormInput,
	FormRow = elemental.FormRow,
	FormSelect = elemental.FormSelect,
	Modal = elemental.Modal,
	ModalHeader = elemental.ModalHeader,
	ModalBody = elemental.ModalBody,
	ModalFooter = elemental.ModalFooter;

module.exports = React.createClass({

	displayName: 'cloudinaryInsertModalLink',

	getInitialState() {
		return {
			formProcessing: false,
			isOpen: false,
			thumbnail: {}
		};
	},

	componentWillUpdate: function (nextProps, nextState) {
	},

	componentDidUpdate: function (prevProps, prevState) {
		if (prevState.isOpen !== this.state.isOpen && this.state.isOpen)
			this.refs.description.getDOMNode().focus();
	},

	handleTextChange: function (max, event) {
		var newStateData = {};
		var setVal = function(v) { newStateData[event.target.name] = v; }
		var val = event.target.value;
		
		setVal(val);
		
		this.setState(newStateData);
	},

	show(thumbnail) {
		this.setState({
			thumbnail: thumbnail,
			isOpen: true,
			description: this.descriptionFromFilename(thumbnail.originalname)
		});
	},

	descriptionFromFilename: function (filename) {
		var desc = filename.indexOf('.') !== -1 ?
			filename.substring(0, filename.lastIndexOf('.')) :
			filename;
		desc = desc.replace(/[-_]/g, ' ');
		desc = desc.split(/(?=[A-Z])/).join(' ');
		desc = desc.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

		return desc;
	},

	keyUp: function (e) {
		switch(e.keyCode) {
			case 13: this.insertImage(); break; //enter
			case 27: this.closeModal(); break; //escape
			default: return;
		}
	},

	buildLinkTag: function () {
		var url = this.state.thumbnail.url;
		var linkto = $(this.refs.linkto.getDOMNode()).find('select').val();
		var alt = this.state.description.replace(/["']/g, '&quot;').replace(/[<>]/g, '');
		
		return '<a href="' + url + '" ' +
			((linkto === undefined || linkto === '') ? '' : ' target="' + linkto + '" ') +
			'>' + alt + '</a> ';
	},

	insertImage: function () {
		if (this.props.insertCallback && typeof this.props.insertCallback === 'function') {
			var tag = this.buildLinkTag();
			this.props.insertCallback(tag);
		};
	},
	
	closeModal: function () {
		this.setState({ isOpen: false });
	},

	toggleModal: function () {
		this.setState({ isOpen: !this.state.isOpen });
	},

	render: function () {
		var linktooptions = [
			{ label: 'Default', value: ''},
			{ label: 'New Window', value: '_blank'}
		];
		return (
			<Modal isOpen={this.state.isOpen} onCancel={this.toggleModal} backdropClosesModal>
				<ModalHeader text="Insert Link" showCloseButton onClose={this.toggleModal} />
				<form onKeyUp={this.keyUp} className="horizontal-form" action="#" onSubmit={this.submitForm} noValidate>
					<ModalBody>
						<FormField label="File">
							<div>{this.state.thumbnail.originalname}</div>
						</FormField>
						<FormField label="Text">
							<FormInput label="Text" type="text" name="description" ref="description" value={this.state.description} onChange={this.handleTextChange.bind(this, undefined)} required size="sm" />
						</FormField>
						<FormSelect label="Link To" ref='linkto' name="linkto" options={linktooptions} />
					</ModalBody>
					<ModalFooter>
						<Button type="primary" onClick={this.insertImage}>Insert Link</Button>
						<Button onClick={this.toggleModal} type="link-cancel" disabled={this.state.formProcessing}>Cancel</Button>
					</ModalFooter>
				</form>
			</Modal>
		);
	}
});