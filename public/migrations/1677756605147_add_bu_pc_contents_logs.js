
const window = require ( 'electron' ).BrowserWindow;
const log = require ( 'electron-log' );

exports.up = async function ( knex, Promise ) {
    const contentsHasPcId = await knex.schema.hasColumn ( 'contents', "parent_content_id" )
        .then ( exists => {
            return exists;
        } ).catch ( error => {
            console.error ( 'error checking if contents has column parent_content_id ', error );
        } );
    const contentsHasBuId = await knex.schema.hasColumn ( 'contents', "business_unit_id" )
        .then ( exists => {
            return exists;
        } ).catch ( error => {
            console.error ( 'error checking if contents has column business_unit_id ', error );
        } );

    const addPcIdAndBuIdToContents = async () => {
        const pcIdAndBuIdAddedToContents = await knex.schema.table ( 'contents', function ( table ) {
            if ( contentsHasPcId === false ) {
                table.string ( 'parent_content_id' );
            }
            if ( contentsHasBuId === false ) {
                table.string ( 'business_unit_id' );
            }
        } ).catch ( ( error ) => {
            log.error ( ' Error adding parent_content_id and business_unit_id properties to contents table, migration 3', error );
        } )
        return pcIdAndBuIdAddedToContents;
    }

    const logsHasPcId = await knex.schema.hasColumn ( 'logs', "parentContentId" )
        .then ( exists => {
            return exists;
        } ).catch ( error => {
            console.error ( 'error checking if contents has column parent_content_id ', error );
        } );
    const logsHasBuId = await knex.schema.hasColumn ( 'logs', "businessUnitid" )
        .then ( exists => {
            return exists;
        } ).catch ( error => {
            console.error ( 'error checking if contents has column business_unit_id ', error );
        } );

    const addPcIdAndBuIdToLogs = async () => {
        const pcIdAndBuIdAddedLogs = await knex.schema.table ( 'logs', function ( table ) {
            if ( logsHasPcId === false ) {
                table.string ( 'parentContentId' );
            }
            if ( logsHasBuId === false ) {
                table.string ( 'businessUnitId' );
            }
        } ).catch ( ( error ) => {
            log.error ( ' Error adding parentContentId and businessUnitId properties to logs table, migration 3', error );
        } )
        return pcIdAndBuIdAddedLogs;
    }
    return addPcIdAndBuIdToContents ()
        .then ( addPcIdAndBuIdToLogs )
        .catch ( ( error ) => {
            log.error ( 'Error on knex.up migration 3', error );
        } )
}

exports.down = function ( knex, Promise ) {
    const dropColumnsAddedToContent = async () => {
        await knex.schema.alterTable ( 'contents', table => {
            table.dropColumn ( 'parent_content_id' );
            table.dropColumn ( 'business_unit_id' )
        } )
    }

    const dropColumnsAddedToLogs = async () => {
        await knex.schema.alterTable ( 'logs', table => {
            table.dropColumn ( 'parentContentId' );
            table.dropColumn ( 'businessUnitId' )
        } )
    }
    return dropColumnsAddedToContent ()
        .then ( dropColumnsAddedToLogs )
        .catch ( ( error ) => {
            log.error ( 'Error on knex.down migration 3', error )
        } )
}
