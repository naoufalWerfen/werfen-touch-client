import React from 'react';
import SideBar from "../SideBar/SideBar";
import Library from "../Library/Library";
import { Col, Container, Row } from "react-bootstrap";
import Logo from "../Logo/Logo";
import './LibraryStage.scss';

const LibraryStage = () => {
    return (
        <Container fluid className={ "LibraryStage component" }>
            <Row className={ "h-100" }>
                <Col xs={ 3 } className={ "LibraryStage__left h-100" }>
                    <Logo/>
                    <SideBar/>
                </Col>
                <Col xs={ 9 } className={ "LibraryStage__right h-100" }>
                    <Library/>
                </Col>
            </Row>
        </Container>
    );
};

export default LibraryStage;
