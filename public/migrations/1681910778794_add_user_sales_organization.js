const log = require("electron-log");
exports.up = async function ( knex, Promise ) {
    const logsSalesOrgUserId = await knex.schema.hasColumn ( 'logs', "salesOrganizationId" )
        .then ( exists => {
            return exists;
        } ).catch ( error => {
            console.error ( 'error checking if logs has column salesOrganizationId ', error );
        } );
    const addSalesOrgToLogs = async () => {
        const salesOrgAddedLogs = await knex.schema.table ( 'logs', function ( table ) {
            if (logsSalesOrgUserId === false) {
                table.string('salesOrganizationId');
            }
        }).catch ( ( error ) => {
            log.error ( ' Error adding sales Organization property to logs table, migration 3', error );
        } )
        return salesOrgAddedLogs;
        }
    return addSalesOrgToLogs ()
        .then (  )
        .catch ( ( error ) => {
            log.error ( 'Error on knex.up migration 4', error );
        } )
}
exports.down = function ( knex, Promise ) {

}