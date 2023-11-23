const electron = require ( 'electron' );
const normalize = require ( 'normalize-path' );
const appDataPath = normalize ( electron.app.getPath ( 'appData' ) ) + '/werfen-touch-client-prod'
const databasePath = appDataPath + '/databases';
const contentDBPath = databasePath + '/content.sqlite';

const log = {
    insert: ( logEntry ) => {
        const {
            id,
            appVersion,
            profileId,
            userId,
            category,
            action,
            dateTime,
            severity,
            synced,
        } = logEntry;
        const contentId = logEntry.contentId ? logEntry.contentId : null;
        const contentName = logEntry.contentName ? logEntry.contentName : null;
        const contentType = logEntry.contentType ? logEntry.contentType : null;
        const value = logEntry.value ? logEntry.value : null;
        const message = logEntry.message ? logEntry.message : null;
        const visitId = logEntry.visitId ? logEntry.visitId : null;
        const parentContentId = logEntry.parentContentId ? logEntry.parentContentId : null;
        const businessUnitId = logEntry.businessUnitId ? logEntry.businessUnitId : null;
        const salesOrganizationId = logEntry.salesOrganizationId ? logEntry.salesOrganizationId : null;
        return new Promise ( ( resolve, reject ) => {

            try {
                if ( !profileId || !userId || !salesOrganizationId ) {
                    reject ( "Please provide required values: profileId, userId, and salesOrganizationId!" )
                } else {
                    const Database = require ( 'better-sqlite3' );
                    const db = new Database ( contentDBPath, {} );
                    const stmt = db
                        .prepare ( `INSERT OR IGNORE INTO logs (id, appVersion, profileId, userId, contentId,
                                                                contentName,
                                                                contentType, category, action, value, dateTime, message,
                                                                severity, synced, visitId, parentContentId,
                                                                businessUnitId, salesOrganizationId)
                                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` );

                    const { lastInsertRowId } = stmt.run ( id, appVersion, profileId, userId, contentId, contentName, contentType, category, action, value, dateTime, message, severity, synced, visitId, parentContentId, businessUnitId, salesOrganizationId )
                    db.close ();
                    resolve ( lastInsertRowId );
                }
            } catch ( error ) {
                console.error ( 'Error in logMethods insert: ', error );
                reject ( error );
            }

        } )

    },
    sendToSync: () => {
        return new Promise ( ( resolve, reject ) => {
            try {
                const Database = require ( 'better-sqlite3' );
                const db = new Database ( contentDBPath, {} );

                const sql = db
                    .prepare ( `SELECT *
                                FROM logs
                                WHERE synced = 0` );

                const rows = sql.all ();

                if ( rows ) {
                    resolve ( rows )
                }
                db.close ();

            } catch ( error ) {
                console.error ( 'Error in logMethods sendToSync: ', error );
                reject ( error );
            }
        } )
    },
    updateSyncedLogs: ( ids ) => {
        const hostsInQuery = Array ( ids.length ).fill ( '?' ).join ( "','" ); // ids.map ( item => '?' ).join ( "','" );

        return new Promise ( ( resolve, reject ) => {
            try {
                const Database = require ( 'better-sqlite3' );
                const db = new Database ( contentDBPath, {} );
                const stmt = db
                    .prepare ( `UPDATE logs
                                SET synced = 1
                                WHERE id IN (?)` );

                const { lastInsertRowId } = stmt.run ( hostsInQuery );
                resolve ( lastInsertRowId );
                db.close ();

            } catch ( error ) {
                console.error ( 'Error in updateSyncedLogs: ', error );
                reject ( error );
            }
        } );
    }
}

module.exports = log
