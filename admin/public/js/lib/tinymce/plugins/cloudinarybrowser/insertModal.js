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
	
	displayName: 'cloudinaryInsertModal',
	
	getInitialState() {
		return {
			formProcessing: false,
			isOpen: false,			
			thumbnail: {}
		};
	},
	
	componentWillUpdate: function(nextProps, nextState) {
	},
	
	recalculateWidthHeight: function(newState) {
		var newWidth = false, newHeight = false;
		
		if(this.state.width !== undefined && this.state.height !== undefined) {
			if(newState.width !== undefined && newState.width !== this.state.width) {
				newWidth = true;
			} else if(newState.height !== undefined && newState.height !== this.state.height) {
				newHeight = true;
			}
		}
		
		var result = _.extend(newState);
		if(newWidth) {
			result.height = Math.round(newState.width / this.state.ratio);
		} else if (newHeight) {
			result.width = Math.round(newState.height * this.state.ratio)
		}
		return result;
	},
	
	handleTextChange: function(max, event) {
		var newStateData = {};
		if (max === undefined || parseInt(event.target.value) < parseInt(max)) {
			newStateData[event.target.name] = Math.round(event.target.value);
			if(event.target.name === "width" || event.target.name === "height")
				newStateData = this.recalculateWidthHeight(newStateData);
			this.setState(newStateData);
		}
	},
	
	show(thumbnail) {
		this.setState({
			thumbnail: thumbnail,
			isOpen: true,
			width: thumbnail.width,
			height: thumbnail.height,
			ratio: parseFloat(thumbnail.width) / parseFloat(thumbnail.height),
			description: this.descriptionFromFilename(thumbnail.filename)
		});
	},
	
	descriptionFromFilename: function(filename) {
		var desc = filename.indexOf('.') !== -1 ?
			filename.substring(0, filename.lastIndexOf('.')) :
			filename;
		desc = desc.replace(/[-_]/g, ' ');
		// desc = desc.split(/(?=[A-Z])/).map(function(p) {
        // 	return p.charAt(0).toUpperCase() + p.slice(1);
    	// }).join(' ');
		desc = desc.split(/(?=[A-Z])/).join(' ');
		desc = desc.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
		
		return desc;
	},
	
	toggleModal() {
		var self = this;
		this.setState({
			isOpen: !this.state.isOpen
		}, function () {
			if (self.state.isOpen) {
				self.refs.first.getDOMNode().focus();
			}
		});
	},
	
	render: function() {
		return (
			<Modal isOpen={this.state.isOpen} onCancel={this.toggleModal} backdropClosesModal>
				<ModalHeader text="Insert Image" showCloseButton onClose={this.toggleModal} />
				<form className="horizontal-form" action="#" onSubmit={this.submitForm} noValidate>
					<ModalBody>
						<FormField label="File">
							<div>{this.state.thumbnail.filename}</div>
						</FormField>
						<FormField label="Description">
							<FormInput label="Description" type="text" name="description" ref="description" value={this.state.description} onChange={this.handleTextChange} required size="sm" />
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
						<Button onClick={this.toggleModal} type="link-cancel" disabled={this.state.formProcessing}>Cancel</Button>
					</ModalFooter>
				</form>
			</Modal>
		);
						//{submitButton}
	}
});