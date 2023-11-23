export default class CALCJs {
    init = ( source, element ) => {
        const iframe = document.createElement( 'iframe' );

        iframe.src = `adamts13-calculator/${ source }`;
        iframe.width = "100%";
        iframe.height = "100%";

        element.appendChild( iframe )
    }
}