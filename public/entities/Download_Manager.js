const { databasePath } = require ( "../constants/AppData" );
const Database = require ( 'better-sqlite3' )

const createQuery = "create table download_manager ( id INTEGER, uuid TEXT not null, name TEXT not null, profile_id INTEGER, group_id INTEGER, category_id INTEGER, file_uuid TEXT, status TEXT not null, version INTEGER not null, package BLOB not null, classification TEXT not null, notification_date DATE not null, package_date DATE not null, installation_date DATE, uninstallation_date DATE, primary key (id autoincrement) );"

class Download_Manager {
    static all () {
        return new Promise ( ( resolve, reject ) => {
            try {
                const db = new Database ( databasePath, {} );
                const stmt = db.prepare ( 'SELECT * FROM download_manager' )
                const rows = stmt.all ();
                resolve ( rows );
                db.close ();
            } catch ( error ) {
                console.error ( error );
                reject ( error );
            }
        } )
    }

    static allPending () {
        return new Promise ( ( resolve, reject ) => {
            try {
                const db = new Database ( databasePath, {} );
                const stmt = db.prepare ( "SELECT * FROM download_manager WHERE status in ('Pending')" );
                const rows = stmt.all ();
                resolve ( rows );
                db.close ();
            } catch ( error ) {
                console.error ( error );
                reject ( error );
            }
        } )
    }


    static find ( id ) {
        return new Promise ( ( resolve, reject ) => {
            try {
                if ( !id ) {
                    reject ( 'Please provide an id' );
                } else {
                    const db = new Database ( databasePath, {} );
                    const stmt = db.prepare ( 'SELECT * FROM download_manager WHERE id = ?' )
                    const rows = stmt.all ( id );
                    resolve ( rows );
                    db.close ();
                }
            } catch ( error ) {
                console.error ( error );
                reject ( error );
            }
        } )

    }

    static create ( downloadManagerEntries ) {
        return new Promise ( ( resolve, reject ) => {
            try {
                const db = new Database ( databasePath, {} );
                const downloadManagerQuery = 'INSERT OR IGNORE INTO download_manager( uuid, name, profile_id, group_id, category_id, file_uuid, filename, url, should_rename, route, status, version, package, classification, notification_date, package_date, installation_date, uninstallation_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
                const stmtDownloadManager = db.prepare ( downloadManagerQuery );

                const insertMany = db.transaction ( ( list ) => {
                    for ( const item of list ) {
                        const {
                            uuid,
                            name,
                            profile_id,
                            group_id,
                            category_id,
                            file_uuid,
                            filename,
                            url,
                            should_rename,
                            route,
                            status,
                            version,
                            classification,
                            notification_date,
                            package_date,
                            installation_date,
                            uninstallation_date
                        } = item;

                        stmtDownloadManager.run (
                            uuid,
                            name,
                            profile_id,
                            group_id,
                            category_id,
                            file_uuid,
                            filename,
                            url,
                            should_rename,
                            route,
                            status,
                            version,
                            item.package,
                            classification,
                            notification_date,
                            package_date,
                            installation_date,
                            uninstallation_date );
                    }
                } )

                insertMany.immediate ( downloadManagerEntries );
                resolve ( true );
                db.close ();
            } catch ( error ) {
                console.error ( error );
                reject ( error );
            }
        } )
    }

    static findByClassification ( classification ) {
        return new Promise ( ( resolve, reject ) => {
            const status = "Installed"
            try {
                const db = new Database ( databasePath, {} );
                const downloadManagerQuery = 'SELECT * FROM download_manager ' +
                    'WHERE classification = ? ' +
                    'AND status = ? ';
                const stmtDownloadManager = db.prepare ( downloadManagerQuery );
                const rows = stmtDownloadManager.all ( classification, status );
                resolve ( rows );
                db.close ();
            } catch ( error ) {
                console.error ( error );
                reject ( error );
            }
        } )
    }

    static findByProfileClassificationAndFilename ( entry ) {
        const { filename, classification, profile_id } = entry;
        return new Promise ( ( resolve, reject ) => {
            const status = "Installed"
            try {
                const db = new Database ( databasePath, {} );
                const downloadManagerQuery = 'SELECT * FROM download_manager ' +
                    'WHERE classification = ? ' +
                    'AND profile_id = ? ' +
                    'AND filename = ? ' +
                    'AND status = ? ';
                const stmtDownloadManager = db.prepare ( downloadManagerQuery );
                const rows = stmtDownloadManager.all ( classification, profile_id, filename, status );
                resolve ( rows );
                db.close ();
            } catch ( error ) {
                console.error ( error );
                reject ( error );
            }
        } )
    }

    static findUniqueEntry ( contentForUpdating ) {
        return new Promise ( ( resolve, reject ) => {
            const status = "Installed"
            try {
                const db = new Database ( databasePath, {} );
                const downloadManagerQuery = 'SELECT * FROM download_manager ' +
                    'WHERE profile_id = ?  ' +
                    'AND category_id = ? ' +
                    'AND uuid = ? ' +
                    'AND classification = ? ' +
                    'AND file_uuid = ? ' +
                    'AND route =  ?' +
                    'AND status = ? ';
                const { profile_id, category_id, uuid, classification, file_uuid, route } = contentForUpdating;
                const stmtDownloadManager = db.prepare ( downloadManagerQuery );
                const rows = stmtDownloadManager.all ( profile_id, category_id, uuid, classification, file_uuid, route, status );
                resolve ( rows );
                db.close ();
            } catch ( error ) {
                console.error ( error );
                reject ( error );
            }
        } )
    }

    static findEntryForProfileCategoryUUIDStatus ( contentForUpdating ) {
        return new Promise ( ( resolve, reject ) => {
            const status = "Installed"
            try {
                const db = new Database ( databasePath, {} );
                const downloadManagerQuery = 'SELECT * FROM download_manager ' +
                    'WHERE profile_id = ?  ' +
                    'AND category_id = ? ' +
                    'AND uuid = ? ' +
                    'AND classification = ? ' +
                    'AND status = ? ';
                const { profile_id, category_id, uuid, classification } = contentForUpdating;
                const stmtDownloadManager = db.prepare ( downloadManagerQuery );
                const rows = stmtDownloadManager.all ( profile_id, category_id, uuid, classification, status );
                resolve ( rows );
                db.close ();
            } catch ( error ) {
                console.error ( error );
                reject ( error );
            }
        } )
    }

    static findEntries ( contentForUpdating, firstInstallation ) {
        return new Promise ( ( resolve, reject ) => {
            const status = firstInstallation ? "Pending" : "Installed";
            try {
                const db = new Database ( databasePath, {} );
                const downloadManagerQuery = 'SELECT * FROM download_manager ' +
                    'WHERE uuid = ? ' +
                    'AND classification = ? ' +
                    'AND file_uuid = ? ' +
                    'AND status = ? ';
                const { uuid, classification, file_uuid } = contentForUpdating;
                const stmtDownloadManager = db.prepare ( downloadManagerQuery );
                const rows = stmtDownloadManager.all ( uuid, classification, file_uuid, status );
                resolve ( rows );
                db.close ();
            } catch ( error ) {
                console.error ( error );
                reject ( error );
            }
        } )
    }

    static findWithStatus ( status ) {
        return new Promise ( ( resolve, reject ) => {
            try {
                const db = new Database ( databasePath, {} );
                const downloadManagerQuery = 'SELECT * FROM download_manager ' +
                    'WHERE status = ? ';
                const stmtDownloadManager = db.prepare ( downloadManagerQuery );
                const rows = stmtDownloadManager.all ( status );
                resolve ( rows );
                db.close ();
            } catch ( error ) {
                console.error ( error );
                reject ( error );
            }
        } )
    }

    static findWithStatuses ( uninstalledStatuses ) {
        return new Promise ( ( resolve, reject ) => {
            try {
                const db = new Database ( databasePath, {} );
                const query = "SELECT * FROM download_manager WHERE status in(" + '\'' + uninstalledStatuses.join ( '\',\'' ) + '\'' + ")";
                const stmt = db.prepare ( query );
                const rows = stmt.all ();
                resolve ( rows );
                db.close ();
            } catch ( error ) {
                console.error ( error );
                reject ( error );
            }
        } )
    }


    static findFileUUIDListForProfile ( userProfile ) {
        return new Promise ( ( resolve, reject ) => {
            const status = "Installed"
            try {
                const db = new Database ( databasePath, {} );
                const downloadManagerQuery = 'SELECT file_uuid FROM download_manager ' +
                    'WHERE profile_id = ?  ' +
                    'AND status = ? ';
                const stmtDownloadManager = db.prepare ( downloadManagerQuery );
                const rows = stmtDownloadManager.all ( userProfile, status );
                resolve ( rows );
                db.close ();
            } catch ( error ) {
                console.error ( error );
                reject ( error );
            }
        } )
    }

    static updateInBulk ( downloadManagerEntries ) {
        return new Promise ( ( resolve, reject ) => {
            try {
                const db = new Database ( databasePath, {} );
                const downloadManagerQuery = 'UPDATE download_manager SET ' +
                    'name = ?, ' +
                    'file_uuid  = ?, ' +
                    'filename = ?, ' +
                    'url = ?, ' +
                    'should_rename = ?, ' +
                    'route = ?, ' +
                    'status = ?, ' +
                    'version = ?, ' +
                    'package = ?, ' +
                    'classification = ?, ' +
                    'notification_date = ?, ' +
                    'package_date = ?, ' +
                    'installation_date = ?, ' +
                    'uninstallation_date = ?' +
                    'WHERE profile_id = ? ' +
                    'AND group_id = ? ' +
                    'AND category_id = ? ' +
                    'AND uuid = ? ';
                const stmtDownloadManager = db.prepare ( downloadManagerQuery );

                const updateMany = db.transaction ( ( list ) => {
                    for ( const item of list ) {
                        const {
                            uuid,
                            name,
                            profile_id,
                            group_id,
                            category_id,
                            file_uuid,
                            filename,
                            url,
                            should_rename,
                            route,
                            status,
                            version,
                            classification,
                            notification_date,
                            package_date,
                            installation_date,
                            uninstallation_date,
                        } = item;

                        stmtDownloadManager.run (
                            name,
                            file_uuid,
                            filename,
                            url,
                            should_rename,
                            route,
                            status,
                            version,
                            item.package,
                            classification,
                            notification_date,
                            package_date,
                            installation_date,
                            uninstallation_date,
                            profile_id,
                            group_id,
                            category_id,
                            uuid );
                    }
                } )

                updateMany.immediate ( downloadManagerEntries );
                resolve ( true );
                db.close ();
            } catch ( error ) {
                console.error ( error );
                reject ( error );
            }
        } )
    }

    static update ( data ) {
        return new Promise ( ( resolve, reject ) => {
            try {
                if ( !data.id || !data.name ) {
                    reject ( 'Please provide an id and a name' )
                } else {
                    const db = new Database ( databasePath, {} );
                    const stmt = db.prepare ( 'UPDATE  download_manager SET name= ?  WHERE id = ?' );
                    const { name, id } = data;

                    const info = stmt.run ( name, id );
                    resolve ( info.lastInsertRowid );
                    db.close ();
                }
            } catch ( error ) {
                console.error ( error );
                reject ( error );
            }
        } )
    }


    static updateStatus ( data ) {
        return new Promise ( ( resolve, reject ) => {
            try {
                if ( !data.uuid || !data.profile_id || !data.category_id ) {
                    reject ( 'Please provide an uuid, profile_id and category_id' );
                } else {
                    const db = new Database ( databasePath, {} );
                    const { status, uuid, category_id, profile_id } = data;
                    const stmt = db.prepare ( 'UPDATE download_manager SET status = ? WHERE uuid = ? AND category_id = ? AND profile_id = ?' );
                    const info = stmt.run ( status, uuid, category_id, profile_id );
                    const result = {
                        id: info.lastInsertRowid,
                        statusUpdated: true
                    }
                    resolve ( result );
                    db.close ();
                }
            } catch ( error ) {
                console.error ( error );
                reject ( error );
            }
        } )
    }

    static updateStatusForNotInstalled ( data ) {
        const { status, statusesToUpdate } = data;
        return new Promise ( ( resolve, reject ) => {
            try {
                if ( !status ) {
                    reject ( 'Please provide a status' );
                } else {
                    const db = new Database ( databasePath, {} );

                    const query = "UPDATE download_manager SET status = ? WHERE status in(" + '\'' + statusesToUpdate.join ( '\',\'' ) + '\'' + ")";
                    const stmt = db.prepare ( query );
                    const info = stmt.run ( status );
                    const result = {
                        id: info.lastInsertRowid,
                        updated: true
                    }
                    resolve ( result );
                    db.close ();
                }
            } catch ( error ) {
                console.error ( error );
                reject ( error );
            }
        } )
    }

    static updateItemPackageDate ( data ) {
        return new Promise ( ( resolve, reject ) => {
            try {
                if ( !data.uuid || !data.profile_id || !data.category_id ) {
                    reject ( 'Please provide an uuid, profile_id and category_id' );
                } else {
                    const db = new Database ( databasePath );
                    const { package_date, uuid, category_id, profile_id } = data;
                    const stmt = db.prepare ( 'UPDATE download_manager SET package_date = ? WHERE uuid = ? AND category_id = ? AND profile_id = ?' );
                    const info = stmt.run ( package_date, uuid, category_id, profile_id );
                    const item = {
                        successful: true,
                        id: info.lastInsertRowid
                    }
                    resolve ( item );
                    db.close ();
                }
            } catch ( error ) {
                console.error ( error );
                reject ( error );
            }
        } )
    }

    static setItemAsInstalled ( data ) {
        return new Promise ( ( resolve, reject ) => {
            try {
                if ( !data.uuid || !data.profile_id || !data.category_id ) {
                    reject ( 'Please provide an uuid, profile_id and category_id' );
                } else {
                    const db = new Database ( databasePath, {} );
                    const { installation_date, status, uuid, category_id, profile_id } = data;
                    const stmt = db.prepare ( 'UPDATE download_manager SET installation_date = ?, status =? WHERE uuid = ? AND category_id = ? AND profile_id = ?' );
                    const info = stmt.run ( installation_date, status, uuid, category_id, profile_id );
                    const result = {
                        rowId: info.lastInsertRowid,
                        installed: true
                    }
                    resolve ( result );
                    db.close ();
                }
            } catch ( error ) {
                console.error ( error );
                reject ( error );
            }
        } )
    }

    static deleteByProfileIdAndContentUUID ( profile_Id, contentUUIDsForDeleting ) {
        return new Promise ( ( resolve, reject ) => {
            try {
                if ( !profile_Id || contentUUIDsForDeleting.length === 0 ) {
                    reject ( 'Please provide an id and a list of contents to delete' );
                } else {
                    const db = new Database ( databasePath, {} );
                    const contentDMQuery = 'DELETE FROM download_manager WHERE profile_Id = ? AND uuid = ?'
                    const stmtDeleteEntry = db.prepare ( contentDMQuery )
                    const deleteManyContents = db.transaction ( ( contentUUIDsForDeleting ) => {
                        for ( const uuid of contentUUIDsForDeleting ) {
                            stmtDeleteEntry.run ( profile_Id, uuid );
                        }
                    } )
                    deleteManyContents.immediate ( contentUUIDsForDeleting );
                    resolve ( true );
                    db.close ();
                }
            } catch ( error ) {
                console.error ( error );
                reject ( error );

            }
        } )
    }

    static deleteByProfileIdCategory ( profile_Id, categoriesIds ) {
        return new Promise ( ( resolve, reject ) => {
            try {
                if ( !profile_Id || categoriesIds.length === 0 ) {
                    reject ( 'Please provide an id and a list of contents to delete' );
                } else {
                    const db = new Database ( databasePath, {} );
                    const contentDMQuery = 'DELETE FROM download_manager WHERE profile_Id = ? AND category_id = ?'
                    const stmtDeleteEntry = db.prepare ( contentDMQuery )
                    const deleteManyContents = db.transaction ( ( categoriesIds ) => {
                        for ( const category_id of categoriesIds ) {
                            stmtDeleteEntry.run ( profile_Id, category_id );
                        }
                    } )
                    deleteManyContents.immediate ( categoriesIds );
                    resolve ( true );
                    db.close ();
                }
            } catch ( error ) {
                console.error ( error );
                reject ( error );

            }
        } )
    }

    static deleteByProfileIdCategoryAndContentRoute ( profile_id, category_id, contentsRoutes ) {
        return new Promise ( ( resolve, reject ) => {
            try {
                if ( !profile_id || !category_id || contentsRoutes.length === 0 ) {
                    reject ( 'Please provide an id for a profile, for a category, and a list of contents to delete' );
                } else {
                    const db = new Database ( databasePath, {} );
                    const contentDMQuery = 'DELETE FROM download_manager WHERE profile_id = ? AND category_id = ? AND route = ?'
                    const stmtDeleteEntry = db.prepare ( contentDMQuery );
                    const deleteManyContents = db.transaction ( ( contentsRoutes ) => {
                        for ( const contentRoute of contentsRoutes ) {
                            stmtDeleteEntry.run ( profile_id, category_id, contentRoute.route );
                        }
                    } )
                    deleteManyContents.immediate ( contentsRoutes );
                    resolve ( true );
                    db.close ();
                }
            } catch ( error ) {
                console.error ( error );
                reject ( error );
            }
        } )
    }

    static deleteByProfileIdCategoryAndContentUUID ( profile_id, category_id, contentUUIDsForDeleting ) {
        return new Promise ( ( resolve, reject ) => {
            try {
                if ( !profile_id || contentUUIDsForDeleting.length === 0 ) {
                    reject ( 'Please provide an id and a list of contents to delete' );
                } else {
                    const db = new Database ( databasePath, {} );
                    const contentDMQuery = 'DELETE FROM download_manager WHERE profile_id = ? AND category_id = ? AND uuid = ?'
                    const stmtDeleteEntry = db.prepare ( contentDMQuery );
                    const deleteManyContents = db.transaction ( ( contentUUIDsForDeleting ) => {
                        for ( const uuid of contentUUIDsForDeleting ) {
                            stmtDeleteEntry.run ( profile_id, category_id, uuid );
                        }
                    } )
                    deleteManyContents.immediate ( contentUUIDsForDeleting );
                    resolve ( true );
                    db.close ();
                }
            } catch ( error ) {
                console.error ( error );
                reject ( error );

            }
        } )
    }

    static deleteByProfileId ( profileId ) {
        return new Promise ( ( resolve, reject ) => {
            try {
                if ( !profileId ) {
                    reject ( 'Please provide an id' )
                } else {
                    const db = new Database ( databasePath, {} );
                    const contentDMQuery = 'DELETE FROM download_manager WHERE profile_id = ?';
                    const stmtDeleteEntry = db.prepare ( contentDMQuery );
                    const info = stmtDeleteEntry.run ( profileId );
                    const data = {
                        deletedId: info.lastInsertRowid,
                        removed: true
                    }
                    resolve ( data );
                    db.close ();
                }
            } catch ( error ) {
                console.error ( error );
                reject ( error );
            }
        } )
    }

    static deleteByClassificationAndRoute ( entry ) {
        const { route, classification } = entry;
        return new Promise ( ( resolve, reject ) => {
            try {
                if ( !route && !classification ) {
                    reject ( 'Please provide an route and classification' )
                } else {
                    const db = new Database ( databasePath, {} );
                    const contentDMQuery = 'DELETE FROM download_manager WHERE route = ? AND classification =?';
                    const stmtDeleteEntry = db.prepare ( contentDMQuery );
                    const info = stmtDeleteEntry.run ( route, classification );
                    resolve ( info.lastInsertRowid );
                    db.close ();
                }
            } catch ( error ) {
                console.error ( error );
                reject ( error );
            }
        } )
    }

    static delete ( id ) {
        return new Promise ( ( resolve, reject ) => {
            try {
                if ( !id ) {
                    reject ( 'Please provide an id' )
                } else {
                    const db = new Database ( databasePath, {} );
                    const stmt = ( 'DELETE FROM download_manager WHERE id = ?' )
                    const info = stmt.run ( id );
                    resolve ( info.lastInsertRowid );
                    db.close ();
                }
            } catch ( error ) {
                console.error ( error );
                reject ( error );
            }
        } )
    }
}

module.exports = Download_Manager;
