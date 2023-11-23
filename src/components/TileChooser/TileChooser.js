import React from 'react';
import VisualsTile from "../VisualsTile/VisualsTile";
import LibraryTile from "../LibraryTile/LibraryTile";
import SearchTile from "../SearchTile/SearchTile";
import { withRouter } from "react-router-dom";

const TileChooser = ( props ) => {
    const pathname = props.history.location.pathname;
    const { dataObject } = props;
    return (
        <>
            { pathname === "/visuals" && <VisualsTile dataObject={ dataObject }/> }
            { pathname === "/library" && <LibraryTile dataObject={ dataObject }/> }
            { ( pathname === "/search" || pathname === "/all" || pathname === "/presentations" || pathname === "/documents" || pathname === "/calculators" || pathname === "/visitsearch" ) &&
            <SearchTile dataObject={ dataObject }/> }
        </>
    );
};

export default withRouter( TileChooser );
