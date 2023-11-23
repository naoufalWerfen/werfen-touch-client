import { DocumentsFolder } from "../constants/AppData";

export default class HYPEJs {
    init = ( source, element, isElectron ) => {
        console.log ( { source } )
        const iframe = document.createElement ( 'iframe' );

        let documentsUri = "//localhost:9990/"
        let electronParam = "";

        if ( window.location.protocol === "file:" ) {
            documentsUri = "file://" + DocumentsFolder;
        }

        if ( isElectron ) {
            electronParam = "?electron=true";
        }

        iframe.src = documentsUri +`visuals/${ source }/index.html`+electronParam;

        iframe.width = "100%";
        iframe.height = "100%";

        element.appendChild( iframe )
    }
}