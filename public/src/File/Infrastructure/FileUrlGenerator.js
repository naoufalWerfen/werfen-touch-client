const backofficeHttpClient  = require('../../Shared/Infrastructure/Http/BackofficeHttpClient')

    async function generate(fileId){
        const log = global.log
        log.info ( "About to generate an url for file with id: ", fileId );
        const response = await backofficeHttpClient.post ( '/api/v2.0/file-url/' + fileId )
            .catch ( ( error ) => {
                log.error ( "Error on generating url for file: ", fileId, error );
            } );
        if ( response.data.file_url ) {
            log.info ( "Got correctly url " + response.data.file_url + " for file with the id: " + fileId );
        }
        return response.data.file_url;
    }


module.exports = {
    generate
}
