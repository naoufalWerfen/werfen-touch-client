import React, { useEffect, useState } from 'react';
import Background from "../Background/Background";
import './USBScreen.scss';
import { Button, Col, Container, Form, Row } from "react-bootstrap";
import isElectron from "is-electron";
import { useTranslation } from 'react-i18next';
import Download from "../../assets/svgsymbols/download";
import Icon from "../Icon/Icon";
import newLogo from "../../assets/logos/New_Werfen_logo.jpg";
import { setAppPhase } from "../../redux/actions/settings";
import { connect } from "react-redux";
import ArrowBack from "../../assets/svgsymbols/arrow-back";

let electron;

if ( isElectron () ) {
    electron = window.require ( "electron" )

}
const ipcRenderer = electron && electron.ipcRenderer;

const USBScreen = ( props ) => {
    const { t } = useTranslation ()

    const[directoryPath, setDirectoryPath] = useState("");
    const [filePath, setFilePath]  = useState([]);
    const [fileName, setFileName] = useState("")
    const [enabled, setEnabled] = useState(false);

    const handleFilePath = (e) => {
        e.preventDefault()
        //TODO: review this logic, get only a path necessary to move the whole resources folder and content.sqlite file into Database
        let fileList = e.target.files;
        let folderPath = "";
        for(let i=0; i < fileList.length; i++ ) {
            let file = fileList[i];     // a File object
            folderPath = file.path.replace(file.name, "");
            setFileName(file.name)
            setFilePath(file.path);
        }
        setDirectoryPath(folderPath);
        setEnabled(true);
    }
    const sendValueChange = (e) => {
        e.preventDefault ();
        let downloadInfo = {};
        downloadInfo.folderPath = directoryPath;
        downloadInfo.filePath = filePath;
        downloadInfo.fileName = fileName;
        //console.info("ipcRenderer send message 'downloadFromUSB' and downloadInfo: ", downloadInfo)
        const firstInstallation = {
            usbInstallation: true
        }
        localStorage.setItem ( "firstInstallation", JSON.stringify ( firstInstallation ) );
        ipcRenderer.send ( 'downloadFromUSB', downloadInfo );
        setFileName ( "" );
    }

    const handleGoingToInstallLobby = ( event ) => {
        event.preventDefault ();
        props.setAppPhase ( 'installLobby' );
        localStorage.removeItem ( 'firstInstallation' );
        localStorage.removeItem ( 'previousAppPhase' );
    }
    useEffect ( () => {
        console.log ( "File name is : ", fileName );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ fileName ] );


    return (
        <div className={ "USBScreen" }>

            <Background/>
            <Container fluid className={ "USBScreen__Container h-100" }>
                <Row className="USBScreen__Box h-100">
                    <Col xs={ 6 } className={ "USBScreen__SideLogo" }>
                        <div>
                            <img src={ newLogo } alt="Werfen"/>
                        </div>
                    </Col>
                    <Col xs={ 6 } className={ "USBScreen__Main" }>
                        <Row>
                            <Col xs={ 12 }>
                                <div className="USBScreen_TitleWrapper">
                                    <span
                                        className={ "USBScreen__Title" }> { t ( "Offline Installation Manager" ) }</span>
                                </div>
                            </Col>
                        </Row>
                        <Row>
                            <Col xs={ { span: 8, offset: 2 } }>
                                <Form className="USBScreen__Form">
                                    <Form.Group controlId="filePath" onSubmit={ sendValueChange }>
                                        <Row className={ "USBScreen__Form--row" }>
                                            <Col xs={ 4 }>
                                                <Form.Label> { t ( "Get File" ) } </Form.Label>
                                            </Col>
                                            <Col xs={ 8 } className={ "USBScreen__Form--box" }>
                                                <div className={ "select-files" }>
                                                    { t ( "Select" ) }
                                                    <Icon
                                                        iconClass={ "USBScreen__Icon" }
                                                        SvgSymbol={ Download }
                                                        viewBox={ "0 0 24 24" }
                                                    />
                                                </div>
                                                <Form.Control type={ "file" }
                                                              onChange={ handleFilePath }
                                                              multiple
                                                >
                                                </Form.Control>
                                            </Col>
                                        </Row>
                                        <Row className={ "USBScreen__Form--row" }>
                                            <Col xs={ 4 }>
                                                <Form.Label> { t ( "Selected file" ) } </Form.Label>
                                            </Col>
                                            <Col xs={ 8 } className={ "USBScreen__Form--box" }>
                                                <span>{ fileName }</span>
                                            </Col>
                                        </Row>
                                        <Row className={ "USBScreen__Form--row" }>
                                            <Col xs={ 4 }/>
                                            <Col xs={ 8 } className="USBScreen__Buttons--submit">
                                                <Button type="submit" disabled={ !enabled }
                                                        onClick={ sendValueChange }
                                                        className={ !enabled ? "USBScreen__Option option-disabled" : "USBScreen__Option option-generic" }>
                                                    { t ( "Submit" ) }
                                                </Button>
                                            </Col>
                                        </Row>
                                    </Form.Group>
                                </Form>
                            </Col>
                        </Row>
                        <div
                            className="USBScreen__Button-back"
                            onClick={ handleGoingToInstallLobby }
                        >
                            <Icon
                                SvgSymbol={ ArrowBack }/>
                        </div>
                    </Col>
                </Row>
            </Container>
        </div>
    );

};


const mapStateToProps = ( state ) => ( {
    appPhase: state.settings.appPhase,
} )

const mapDispatchToProps = ( dispatch ) => {
    return {
        setAppPhase: ( appPhase ) => dispatch ( setAppPhase ( appPhase ) )
    }
}

export default connect ( mapStateToProps, mapDispatchToProps ) ( USBScreen );
