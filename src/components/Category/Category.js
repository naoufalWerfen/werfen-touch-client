import React from 'react';
import { Col, Container, Row } from "react-bootstrap";
import "./Category.scss"

const Category = ( props ) => {
    return (
        <Container className={ "Category box-generic" }>
            { props.appPhase !== "visitActive" && <Row className={ "Category__Row" }>
                <Col xs={ 12 } className={ "Category__Image" }
                     style={ { backgroundImage: `url(${ props.image })` } }/>
                <Col xs={ 12 } className={ "Category__Side" }>{ props.title }</Col>
            </Row> }
            { props.appPhase === "visitActive" && <Row className={ "Category__Row" }>
                <Col xs={ 12 } className={ "Category__Image--visit" }>
                    { props.title }</Col>
                <Col xs={ 12 }
                     className={ "Category__Side" }
                     style={ {
                         backgroundImage: `url(${ props.image })`,
                         backgroundPosition: "50% 50%"
                     } }>
                </Col>
            </Row> }
        </Container>
    );
};

export default Category;
