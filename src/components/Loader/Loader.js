import React, { Component } from 'react';
import { Spinner } from "react-bootstrap";
import './Loader.scss';

class Loader extends Component {

    render() {
        return (
                <Spinner animation="border" role="status" className={ "Loader spinner-border" }>
                    <span className="sr-only">Loading</span>
                </Spinner>
        );
    }
}

export default Loader;