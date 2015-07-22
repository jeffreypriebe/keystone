var React = require('react');
var elemental = require('elemental'),
	Button = elemental.Button,
	FormField = elemental.FormField,
	FormInput = elemental.FormInput,
	Modal = elemental.Modal,
	ModalHeader = elemental.ModalHeader,
	ModalBody = elemental.ModalBody,
	ModalFooter = elemental.ModalFooter;

module.exports = React.createClass({
	
	displayName: 'cloudinaryInsertModal',
	
	getInitialState() {
		return {
			formProcessing: false,
			isOpen: false,
			email: '',
			password: ''
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
				<form action="#" onSubmit={this.submitForm} noValidate>
					<ModalBody>
						<FormField label="Email">
							<FormInput label="Email" type="email" name="email" ref="email" value={this.state.email} required />
						</FormField>
						<FormField label="Password">
							<FormInput label="Password" type="password" name="password" ref="password" value={this.state.password} required />
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