import React from 'react';
import { Col, Container, Row } from 'react-bootstrap'
import Logo from "../Logo/Logo";
import SectionList from "../CategoriesList/CategoriesList";
import "./Home.scss";

const Home = () => {
    return (
        <Container fluid className={ "Home component" }>
            <Row className={ "h-100" }>
                <Logo/>
                <Col xs={ { span: 6, offset: 6 } } className={ "Home__Right" }>
                    <SectionList/>
                </Col>
            </Row>
        </Container>
    );
};

export default Home;
