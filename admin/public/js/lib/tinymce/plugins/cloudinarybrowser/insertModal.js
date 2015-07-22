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

module.exports = React.createClass({
	
	displayName: 'cloudinaryInsertModal',
	
	getInitialState() {
		return {
			formProcessing: false,
			isOpen: true, //false,
			email: '',
			password: '',
			
			//defaultDescription: this.
		};
	},
	
	show() {
		this.setState({ isOpen: true });
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
							<div>Filename here</div>
						</FormField>
						<FormField label="Description">
							<FormInput label="Description" type="text" name="description" ref="description" placeholder={this.state.defaultDescription} required size="sm" />
						</FormField>
						<FormField label="Size">
							<FormRow>
								<FormField label="Width">
									<FormInput label="Width" pattern="[0-9]+" name="width" ref="width" />
								</FormField>
								<div className="form-field size-x">x</div>
								<FormField label="Height">
									<FormInput label="Height" pattern="[0-9]+" name="height" ref="height" />
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