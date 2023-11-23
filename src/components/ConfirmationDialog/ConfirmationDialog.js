import React, { useState } from 'react';
import { Button, Form, Modal } from "react-bootstrap";
import { useTranslation } from "react-i18next";


const ConfirmationDialog = ( props ) => {
    const { t } = useTranslation ();
    const [ textValue, setTextValue ] = useState ( "" );
    return (
        <Modal
            show={ props.show }
            onHide={ props.onHide }
            contentClassName={ `Settings__Modal--${ props.contentClassName }` }
            dialogClassName={ `Settings__${ props.contentClassName }` }
        >
            { props.displayConfirmationInput ? <Modal.Header>
                <Modal.Title>{ props.title }</Modal.Title>
            </Modal.Header> : <Modal.Header closeButton>
                <Modal.Title>{ props.title }</Modal.Title>
            </Modal.Header> }
            <Modal.Body>{ props.messageArray.map ( ( line, index ) => {
                return (
                    <p key={ index }>{ line }</p>
                )
            } ) }</Modal.Body>
            <Modal.Footer>
                { props.displayConfirmationInput && <Form.Group>
                    { props.confirmationInputType === "reinstall" && <Form.Label>
                        { t ( "Close dialog button condition" ) }
                    </Form.Label> }
                    { props.confirmationInputType === "unistallContent" && <Form.Label>
                        { t ( "Close unistallation dialog button condition" ) }
                    </Form.Label> }
                    <Form.Control
                        id={ "displayConfirmationInput" }
                        type={ "text" }
                        onChange={ ( e ) => setTextValue ( e.target.value ) }
                    />
                </Form.Group> }
                { props.labelCancel !== "" && <Button variant="secondary" onClick={ props.handleOnCancel }>
                    { props.labelCancel }
                </Button> }
                { props.labelAccept !== "" && props.displayConfirmationInput === true && <Button
                    variant={ "primary" }
                    disabled={ textValue !== "Accept" }
                    onClick={ props.handleOnAccept }>
                    { props.labelAccept }
                </Button> }
                { props.labelAccept !== "" && props.displayConfirmationInput === false && <Button
                    variant="primary"
                    onClick={ props.handleOnAccept }>
                    { props.labelAccept }
                </Button> }
            </Modal.Footer>
        </Modal>
    );
};
export default ConfirmationDialog;
