import React from 'react';
import SideBar from "../SideBar/SideBar";
import { Col, Container, Row } from "react-bootstrap";
import Logo from "../Logo/Logo";
import './DocumentsStage.scss';
import VisitDocuments from "../VisitDocuments/VisitDocuments";

const DocumentsStage = ( props ) => {
    return (
        <Container fluid className={ "DocumentsStage component" }>
            <Row>
                <Col xs={ 3 } className={ "DocumentsStage__left" }>
                    <Logo/>
                    <SideBar/>
                </Col>
                <Col xs={ 9 } className={ "DocumentsStage__right" }>
                    <VisitDocuments userProfile={ props.userProfile } content={ props.content }/>
                </Col>
            </Row>
        </Container>
    );
};

export default DocumentsStage;
