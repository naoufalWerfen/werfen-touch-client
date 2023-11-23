import React from 'react';
import SideBar from "../SideBar/SideBar";
import { Col, Container, Row } from "react-bootstrap";
import Logo from "../Logo/Logo";
import './SearchStage.scss';
import Search from "../Search/Search.js"

const SearchStage = () => {
    return (
        <Container fluid className={ "SearchStage component" }>
            <Row className={ "h-100" }>
                <Col xs={ 3 } className={ "SearchStage__left h-100" }>
                    <Logo/>
                    <SideBar/>
                </Col>
                <Col xs={ 9 } className={ "SearchStage__right h-100" }>
                    <Search/>
                </Col>
            </Row>
        </Container>
    );
};

export default SearchStage;
