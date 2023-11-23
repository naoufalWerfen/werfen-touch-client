import React from 'react';
import { Modal } from "react-bootstrap";
import "./ModalScreen.scss"


const ModalScreen = ( props ) => {
    return (
        <Modal
            dialogClassName={"Modal_Screen"}
            show={ props.show }
            onHide={ props.onHide }
            contentClassName={ "Modal_Screen__Content" }
            centered
        >
            <Modal.Header closeButton>
                <Modal.Title>{ "Showing downloads for profile: " + props.profileName }</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                { props.componentToShow }
            </Modal.Body>
        </Modal>
    );
};
export default ModalScreen;
