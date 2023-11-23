import React, { useEffect, useState } from 'react';
import Background from "../Background/Background";
import { connect } from "react-redux";
import { setNavigationItem } from "../../redux/actions/navigation";
import { Button, Col, Container, Form, Row } from "react-bootstrap";
//import {LoginURL} from "../../constants/AppData";
import './Pin.scss';
import isElectron from "is-electron";
import Logo from "../Logo/Logo";

let electron;

if ( isElectron() ) {
    electron = window.require( "electron" )
}
const ipcRenderer = electron && electron.ipcRenderer;

const Pin = ( props) => {
    const [pin, setPin] = useState("");

    const handlePin = (event) => setPin(event.target.value.toString());

    const handleSubmit = (event) => {
        event.persist();
        event.preventDefault();
        const storedPin = localStorage.getItem("pin");
        if (storedPin === pin) {
            ipcRenderer.send('onPinFinished');
        }
    }

    useEffect( () => {
        props.setNavigationItem(0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [] );

    return (
        <>
            <Background/>
            <Logo/>
           <Container fluid className={"Login "}>
               <Row>
                   <Col xs={{span: 4, offset:7}}  >
                       <h1 className={"Login__Title"}>Please enter PIN</h1>
                       <div className={"Login__Body"}>
                           <Form className={"Login__Form"} onSubmit={handleSubmit}>
                               <Form.Group controlId="formUserPin">
                                   <Form.Label className={"text-left"}><span>PIN number</span></Form.Label>
                                   <Form.Control className={"Login__Input Login__Input--pin"} name="PIN" value={pin} onChange={handlePin} type="number"/>
                               </Form.Group>

                               <div className={"text-right"}>
                                   <Button className={"Login__Submit"} type="submit">Submit</Button>
                               </div>
                           </Form>
                       </div>
                   </Col>
               </Row>

           </Container>
        </>
    );
};

const mapStateToProps = ( state ) => ({
    navigationItem: state.navigation.navigationItem
})

const mapDispatchToProps = ( dispatch ) => {
    return {
        setNavigationItem: ( navigationItem ) => dispatch( setNavigationItem( navigationItem ) )
    }
}

export default connect( mapStateToProps, mapDispatchToProps )( Pin );