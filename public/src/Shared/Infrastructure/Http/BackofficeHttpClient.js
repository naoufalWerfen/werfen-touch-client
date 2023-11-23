const jwtTokenProvider = require ( '../../../Auth/Application/JwtTokenProvider' )
const axios = require ( "axios" );

const backofficeApiBaseUrl = process.env.API_ENDPOINT

//+ '/api/v2.0/file-url/' + fileId; // Replace with your API URL


async function post ( url ) {
    const log = global.log
    const jwtToken = await getToken ()
        .catch ( ( error ) => {
            log.error ( "Error while getting JWT token: ", error );
        } )

    const headers = {
        Authorization: `Bearer ${ jwtToken }`, // Attach JWT token in the "Authorization" header
        'Content-Type': 'application/json', // Adjust the content type as needed
    };

    const result = await  axios
        .post ( backofficeApiBaseUrl  + url, {}, { headers } )
        .then ( ( response ) => {
            // Handle the response here
            log.info ( 'BackofficeHttpClient::post: Http request response', response.data )
            return response
        } )
        .catch ( ( error ) => {
            // Handle errors here
            log.error ( 'BackofficeHttpClient::post: Error on Http Post Request file:', error, jwtToken, headers  );
        } );
    log.info('BackofficeHttpClient::post: result value', result )
    return result;
}

async function getToken () {
    return await jwtTokenProvider.getToken()
}


module.exports = {
    post
}
