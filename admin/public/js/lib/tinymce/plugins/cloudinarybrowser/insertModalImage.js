var React = require('react');
var elemental = require('elemental'),
	Button = elemental.Button,
	FormField = elemental.FormField,
	FormInput = elemental.FormInput,
	FormRow = elemental.FormRow,
	Modal = elemental.Modal,
	ModalHeader = elemental.ModalHeader,
	ModalBody = elemental.ModalBody,
	ModalFooter = elemental.ModalFooter;

var maxImagePixels = 40000;

module.exports = React.createClass({

	displayName: 'cloudinaryInsertModalImage',

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

	recalculateWidthHeight: function (newState) {
		var newWidth = false, newHeight = false;

		if (this.state.width !== undefined && this.state.height !== undefined) {
			if (newState.width !== undefined && newState.width !== this.state.width) {
				newWidth = true;
			} else if (newState.height !== undefined && newState.height !== this.state.height) {
				newHeight = true;
			}
		}

		var result = _.extend(newState);
		if (newWidth) {
			result.height = Math.round(newState.width / this.state.ratio);
		} else if (newHeight) {
			result.width = Math.round(newState.height * this.state.ratio)
		}
		return result;
	},

	handleTextChange: function (max, event) {
		var newStateData = {};
		var setVal = function(v) { newStateData[event.target.name] = v; }
		var val = event.target.value;	
		
		if (isNaN(val)) {
			setVal(val);
		} else if (!isNaN(val) && (max === undefined || parseInt(val) < parseInt(max))) {
			setVal(Math.round(val));
			if (event.target.name === "width" || event.target.name === "height")
				newStateData = this.recalculateWidthHeight(newStateData);
		}
		
		this.setState(newStateData);
	},

	show(thumbnail) {
		var width = thumbnail.width;
		var height = thumbnail.height;
		var ratio = parseFloat(thumbnail.width) / parseFloat(thumbnail.height);
		if (this.props.defaultWidth !== undefined && width > this.props.defaultWidth) {
			width = this.props.defaultWidth;
			height = Math.round(width / ratio); 
		}
		
		this.setState({
			thumbnail: thumbnail,
			isOpen: true,
			width: width,
			height: height,
			ratio: ratio,
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

	buildImageTag: function () {
		var id = this.state.thumbnail.public_id.replace(/["']/g, '&quot;');
		var width = this.state.width;
		var height = this.state.height;
		var cloudinaryUrl = $.cloudinary.url(id, { width: width, height: height, crop: 'fill' });
		var url = cloudinaryUrl.replace('http:', ''); //make protocol relative
		var alt = this.state.description.replace(/["']/g, '&quot;');

		return '<img id="' + id + '" ' +
			'src="' + url + '" ' +
			'alt="' + alt + '" ' +
			'width="' + width + '" ' +
			'height="' + height + '" ' +
			'/>';
	},

	insertImage: function () {
		if (this.props.insertCallback && typeof this.props.insertCallback === 'function') {
			var imageTag = this.buildImageTag();
			this.props.insertCallback(imageTag);
		};
	},
	
	closeModal: function () {
		this.setState({ isOpen: false });
	},

	toggleModal: function () {
		this.setState({ isOpen: !this.state.isOpen });
	},

	render: function () {
		return (
			<Modal isOpen={this.state.isOpen} onCancel={this.toggleModal} backdropClosesModal>
				<ModalHeader text="Insert Image" showCloseButton onClose={this.toggleModal} />
				<form onKeyUp={this.keyUp} className="horizontal-form" action="#" onSubmit={this.submitForm} noValidate>
					<ModalBody>
						<FormField label="File">
							<div>{this.state.thumbnail.originalname}</div>
						</FormField>
						<FormField label="Description">
							<FormInput label="Description" type="text" name="description" ref="description" value={this.state.description} onChange={this.handleTextChange.bind(this, undefined)} required size="sm" />
						</FormField>
						<FormField label="Size">
							<FormRow>
								<FormField label="Width">
										<FormInput label="Width" pattern="[0-9]+" name="width" value={this.state.width} onChange={this.handleTextChange.bind(this, maxImagePixels)} ref="width" />
								</FormField>
								<div className="form-field size-x">x</div>
								<FormField label="Height">
									<FormInput label="Height" pattern="[0-9]+" name="height" value={this.state.height} onChange={this.handleTextChange.bind(this, maxImagePixels)} ref="height" />
								</FormField>
							</FormRow>
						</FormField>
					</ModalBody>
					<ModalFooter>
						<Button type="primary" onClick={this.insertImage}>Insert Image</Button>
						<Button onClick={this.toggleModal} type="link-cancel" disabled={this.state.formProcessing}>Cancel</Button>
					</ModalFooter>
				</form>
			</Modal>
		);
	}
});