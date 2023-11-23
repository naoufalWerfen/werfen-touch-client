import { DocumentsFolder } from "../constants/AppData";

export default class PDFJs {
    init = ( source, element ) => {
        const iframe = document.createElement ( 'iframe' );

        let documentsUri = "//localhost:9990/"

        if ( window.location.protocol === "file:" ) {
            documentsUri = "file://" + DocumentsFolder;
        }

        iframe.src = `${ documentsUri }dependencies/pdfjs/web/viewer.html?file=../../../library/${ source }`;

        iframe.width = "100%";
        iframe.height = "100%";
        element.appendChild( iframe )
    }
}
