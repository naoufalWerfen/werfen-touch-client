import React from 'react';
import { Col, Container, Row } from 'react-bootstrap'
import Logo from "../Logo/Logo";
import SectionList from "../CategoriesList/CategoriesList";
import "./VisitHome.scss";

const VisitHome = ( props ) => {
    return (
        <Container fluid className={ "Home component" }>
            <Row>
                <Logo/>
                <Col xs={ { span: 7, offset: 5 } } className={ "Home__Right" }>
                    <SectionList/>
                    <div
                        className={ 'finish' }
                        onClick={ props.handleFinishVisit }
                    >
                        Finish visit
                    </div>
                </Col>
            </Row>
        </Container>
    );
};

export default VisitHome;
