// noinspection JSUnusedLocalSymbols

const electron = require ( 'electron' );
const fsHelpers = require ( './helpers' )
const normalize = require ( 'normalize-path' );
const Database = require ( 'better-sqlite3' );
const { initialDBQuery } = require ( './constants/initialDBquery' );
const appDataPath = normalize ( electron.app.getPath ( 'appData' ) ) + '/werfen-touch-client-prod'
const databasePath = appDataPath + '/databases';
const contentDBPath = databasePath + '/content.sqlite';
const methods = {
    createDatabase: function () {
        console.log ( 'databasePath ', databasePath )
        const test = {
            message: 'databasePath value',
            error: databasePath,
            subject: 'Message from MAIN'
        }
        return new Promise ( ( resolve, reject ) => {
            try {
                fsHelpers.doCreateFolder ( databasePath )
                    .then ( () =>
                        doCreateDatabase ()
                            .then ( ( res ) => {
                                if ( res ) {
                                    resolve ( true );
                                }
                            } )
                            .catch ( ( error ) => {
                                console.log ( 'SQL error ', error );
                                reject ( error );
                            } )
                    )
                    .catch ( ( error ) => {
                        console.log ( 'FS error ', error );
                        reject ( 'FS error ', error )
                    } );
            } catch ( error ) {
                console.error ( 'Error: ' + error );
                reject ( { error, test } )
            }
        } )
    },
    insertIntoDatabase: doInsertIntoDB,
    getItemFromTable: doGetItemFromTable,
    getContentsForProfile: doGetContentForProfile,
    getLandingForProfile: doGetLandingForProfile,
    getCategories: doGetCategories,
    getFirstCategories: doGetFirstCategories,
    getPublishedContent: doGetPublishedContent,
    getSearchedContent: doGetSearchedContent,
    getSearchedEmails: doGetSearchedEmails,
    getSearchedVisits: doGetSearchedVisits,
    getFirstInstallationValue: doGetFirstInstallationValue,
    updateUserSettings: doUpdateUserSettings,
    updateEmailStatus: doUpdateEmailStatus,
    getUpdatesList: doGetUpdatesList,
    getPackagesList: doGetPackagesList,
    doUpdateIntoDB: updateIntoDB,
    doUpdateColumnIntoDB: updateColumnIntoDB,
    doGetAllItemsFromTable: getAllItemsFromTable,
    findMyUUID: doFindMyUUID,
    doDeleteItemWithUuid: deleteItemWithUUID,
    doDeleteItemFromRelationalTable: deleteItemFromRelationalTable,
    doGetContentDataForDownloadManager: getContentDataForDownloadManager,
    doGetMaximumValueFromTable: getMaximumValueFromTable,
    getItemsFromTableByField,
    saveContent,
    setContentAsDeleted,
    updateItemStatusInDm,
    setContentsAsDeleted,
    updateContentInDB,
    updateDownloadManagerForInstallingFiles,
    removeGroupsUniqueName
};

function doCreateDatabase () {
    return new Promise ( ( resolve, reject ) => {
        const Database = require ( 'better-sqlite3' );
        let db = new Database ( contentDBPath, {} );

        try {
            db.exec ( initialDBQuery );
            resolve ( true );

        } catch ( error ) {
            console.error ( error )
            reject ( error )
        }
        db.close ();

    } )
}

function getAllItemsFromTable ( tableName, properties ) {
    return new Promise ( ( resolve, reject ) => {
        try {
            const Database = require ( 'better-sqlite3' );
            const db = new Database ( contentDBPath, {} );
            let sql = `SELECT *
                       FROM ${ tableName }`;
            if ( properties !== undefined ) {
                sql += ` ${ properties }`
            }
            const query = db.prepare ( sql );
            const rows = query.all ();
            if ( rows ) {
                resolve ( rows );
            }
            db.close ();
        } catch ( error ) {
            console.error ( error );
            reject ( error );
        }
    } )
}

function getMaximumValueFromTable ( columnName, tableName ) {
    return new Promise ( ( resolve, reject ) => {
        try {
            const Database = require ( 'better-sqlite3' );
            const db = new Database ( contentDBPath, {} );
            const sql = db
                .prepare ( `SELECT max(?)
                            FROM ?` )
            const rows = sql.all ( columnName, tableName );
            if ( rows ) {
                resolve ( rows );
            }
            db.close ();
        } catch ( error ) {
            console.info ( 'Error in maxValue ', error );
            reject ( error );
        }
    } )
}

function doGetFirstInstallationValue () {
    return new Promise ( ( resolve, reject ) => {
        try {
            const Database = require ( 'better-sqlite3' );
            const db = new Database ( contentDBPath, {} );
            let sql = db
                .prepare ( `SELECT *
                            FROM user_settings
                            WHERE key = ? ` );
            const rows = sql.all ( 'firstInstalling' );
            if ( rows.length > 0 ) {
                const firstInstalling = rows[0].value === 'true';
                resolve ( firstInstalling );
            }
            // else { resolve (false) }
            db.close ();
        } catch ( error ) {
            console.error ( error );
            reject ( error );
        }
    } )
}

function doGetItemFromTable ( tableName, itemProperty, itemValue ) {
    return new Promise ( ( resolve, reject ) => {
        try {
            const Database = require ( 'better-sqlite3' );
            const db = new Database ( contentDBPath, {} );
            let sql = db
                .prepare ( `SELECT *
                            FROM ?
                            WHERE ? = ?` );
            const rows = sql.all ( tableName, itemProperty, itemValue )

            if ( rows ) {
                resolve ( rows )
            }
            // else { resolve (false) }
            db.close ();
        } catch ( error ) {
            console.error ( error );
            reject ( error );
        }
    } )
}

function doInsertIntoDB ( table, object ) {
    return new Promise ( ( resolve, reject ) => {
        try {
            const Database = require ( 'better-sqlite3' );
            const db = new Database ( contentDBPath, {} );
            const values = Object.values ( object ); //array
            const keys = Object.keys ( object ).join ( ',' );// string
            let valuesString = Array ( values.length ).fill ( '?' ).join ( ',' );
            // const stmt = db
            //     .prepare ( `INSERT
            //     OR IGNORE INTO ${table} ( ${keys} ) VALUES (${ valuesString } )` );
            const stmt = db
                .prepare ( 'INSERT OR IGNORE INTO ' + table + ' ( ' + keys + ' ) VALUES ( ' + valuesString + ' )' );
            const info = stmt.run ( values );
            // noinspection JSUnresolvedVariable
            resolve ( info.lastInsertRowId )
            db.close ();
        } catch ( error ) {
            console.error ( error );
            reject ( error );
        }
    } )
}

function updateIntoDB ( table, object ) {
    return new Promise ( ( resolve, reject ) => {
        try {
            const Database = require ( 'better-sqlite3' );
            const db = new Database ( contentDBPath, {} );
            const uuid = object.uuid;
            delete object.uuid;
            const entries = Object.entries ( object );
            const setString = entries.map ( item => ( `${ item[0] } = ${ item[1] }` ) ).join ( "','" )

            const stmt = db
                .prepare ( `UPDATE ?
                            SET ?
                            WHERE uuid = ?` );
            const info = stmt.run ( table, setString, uuid );
            // noinspection JSUnresolvedVariable
            resolve ( info.lastInsertRowId );
            db.close ();
        } catch ( error ) {
            console.error ( 'error in updateIntoDB: ', error );
            reject ( error )
        }
    } )
}

function updateDownloadMangerEntry ( table, object ) {
    return new Promise ( ( resolve, reject ) => {
            try {
                const Database = require ( 'better-sqlite3' );
                const db = new Database ( contentDBPath, {} );
                delete object.uuid;
                const entries = Object.entries ( object );
                const setString = entries.map ( item => ( `${ item[0] } = ${ item[1] }` ) ).join ( "','" )
                const stmt = db
                    .prepare ( `UPDATE ?
                                SET ?
                                WHERE uuid = ?
                                  AND profile_id = ?` );
                const info = stmt.run ( table, setString, object.uuid, object.profile_id );
                // noinspection JSUnresolvedVariable
                resolve ( info.lastInsertRowId );
                db.close ();
            } catch
                ( error ) {
                console.error ( 'error in updateIntoDB: ', error );
                reject ( error )
            }
        }
    )
}

function updateColumnIntoDB ( table, column, value, valueToUpdate ) {
    return new Promise ( ( resolve, reject ) => {
        try {
            const Database = require ( 'better-sqlite3' );
            const db = new Database ( contentDBPath, {} );
            let sql = db
                .prepare ( `UPDATE download_manager
                            SET status = 'Installed'
                            WHERE status = 'Postponed'` );
            //let sql = db.prepare('UPDATE ' + table + ' SET ' + column + '=' + value + ' WHERE ' + column + '=' + valueToUpdate
            //let sql = db.prepare('UPDATE ' + table + ' SET \'column\' = \'' + value + '\' WHERE \'column\' = Pending'
            const rows = sql.all ()
            if ( rows ) {
                resolve ( rows );
            }
            // else { resolve ( false )}
            db.close ();
        } catch ( error ) {
            console.error ( error );
            reject ( error );
        }
        //console.log('Table, column and value on updating: ', table, column, value, valueToUpdate)

    } )
}

function doGetContentForProfile ( profileId ) {
    return new Promise ( ( resolve, reject ) => {
        try {
            const Database = require ( 'better-sqlite3' );
            const db = new Database ( contentDBPath, {} );
            let sql = db
                .prepare ( `SELECT *
                            FROM contents
                                     INNER JOIN profiles_contents ON contents.id = profiles_contents.content_UUID
                            WHERE profiles_contents.profile_id = ?` )
            const rows = sql.all ( profileId );
            if ( rows ) {
                resolve ( rows );
            }
            db.close ();
        } catch ( error ) {
            console.error ( error );
            reject ( error );

        }
    } )
}

function doGetLandingForProfile ( profileId ) {
    return new Promise ( ( resolve, reject ) => {
        try {
            const Database = require ( 'better-sqlite3' );
            const db = new Database ( contentDBPath, {} );
            let sql = db
                .prepare ( `SELECT *
                            FROM landing
                                     INNER JOIN profiles_landing ON landing.id = profiles_landing.landing_id
                            WHERE profiles_landing.profile_Id = ?` )
            const rows = sql.all ( profileId );
            if ( rows ) {
                resolve ( rows );
            }
            db.close ();
        } catch ( error ) {
            console.error ( error );
            reject ( error );
        }
    } )
}

function doGetCategoriesForGroup ( gid ) {
    return new Promise ( ( resolve, reject ) => {
        try {
            const Database = require ( 'better-sqlite3' );
            const db = new Database ( contentDBPath, {} );
            let sql = db
                .prepare ( `SELECT *
                            FROM categories
                            WHERE gid = ?` );
            const rows = sql.all ( gid );
            if ( rows ) {
                resolve ( rows );
            }
            db.close ();
        } catch ( error ) {
            console.error ( error );
            reject ( error );
        }
    } )
}

function doGetCategories () {
    return new Promise ( ( resolve, reject ) => {
        try {
            const Database = require ( 'better-sqlite3' );
            const db = new Database ( contentDBPath, {} );
            let sql = db
                .prepare ( `SELECT categories.name AS cat_title,
                                   groups.name     AS title,
                                   groups.image    AS color
                            FROM categories
                                     INNER JOIN groups ON categories.gid = groups.id
                            ORDER BY categories.gid` );
            const rows = sql.all ();
            if ( rows ) {
                resolve ( rows );
            }
            db.close ();
        } catch ( error ) {
            console.error ( error );
            reject ( error );
        }
    } )
}

function doGetFirstCategories ( profile ) {
    return new Promise ( ( resolve, reject ) => {
        const Database = require ( 'better-sqlite3' );
        const db = new Database ( contentDBPath, {} );
        try {
            let sql = db
                .prepare ( `SELECT categories.name                AS title,
                                   MIN(categories.sorting_number) AS sorting_number,
                                   groups.name                    AS groups_title,
                                   groups.id                      AS groups_id,
                                   groups.sorting_number          AS groups_sorting_number,
                                   profiles_contents.profile_Id   AS profile_id
                            FROM categories
                                     INNER JOIN groups ON categories.gid = groups.id
                                     INNER JOIN categories_contents ON categories.id = categories_contents.cat_Id
                                     INNER JOIN contents ON contents.uuid = categories_contents.content_UUID
                                     INNER JOIN profiles_contents ON contents.uuid = profiles_contents.content_UUID
                            WHERE profiles_contents.profile_Id = '${ profile }'
                              AND contents.classification = 'visuals'
                              AND contents.visible = 1
                            GROUP BY groups_title
                            ORDER BY groups_sorting_number ` );
            const rows = sql.all ();
            if ( rows ) {
                resolve ( rows );
            }
            db.close ();
        } catch ( error ) {
            console.error ( error );
            reject ( error );
        }
    } )
}

function doGetPublishedContent ( type, profile ) {
    return new Promise ( ( resolve, reject ) => {
        try {
            const Database = require ( 'better-sqlite3' );
            const db = new Database ( contentDBPath, {} );
            let sql = db
                .prepare ( `SELECT DISTINCT c.uuid               AS uuid,
                                            c.id                 AS id,
                                            c.name               AS title,
                                            c.image              AS image,
                                            c.route              AS route,
                                            c.sorting_name       AS sorting_name,
                                            c.classification     AS type,
                                            cc.cat_Id            AS cid,
                                            c.sorting_number     AS sorting_number,
                                            c.tid                AS tid,
                                            c.parent_content_id  AS parent_content_id,
                                            c.business_unit_id   AS business_unit_id,
                                            cats.sorting_number  AS cat_sorting_id,
                                            cats.name            AS category_title,
                                            cats.image           AS category_image,
                                            cats.gid             AS group_id,
                                            grps.sorting_number  AS group_sorting_id,
                                            grps.name            AS group_title,
                                            grps.image           AS group_color,
                                            prfs.id              AS profile_id,
                                            prfs.name            AS profile_name,
                                            ct.id                AS ct_id,
                                            ct.sorting_key       AS ct_sortingKey,
                                            ct.name              AS ct_name,
                                            ct.color             AS ct_color,
                                            dm.uuid              AS dm_uuid,
                                            dm.status            AS status,
                                            dm.profile_id        AS dm_profileId,
                                            dm.group_id          AS dm_groupId,
                                            dm.category_id       AS dm_catId,
                                            dm.installation_date AS dm_installationDate,
                                            dm.package_date      AS dm_packageDate
                            FROM contents AS c
                                     INNER JOIN (SELECT uuid, MAX(version) AS MaxVersion FROM contents GROUP BY uuid) AS groupedContents
                                                ON c.uuid = groupedContents.uuid AND
                                                   c.version = groupedContents.MaxVersion
                                     INNER JOIN profiles_contents ON c.uuid = profiles_contents.content_UUID
                                     INNER JOIN categories_contents AS cc ON c.uuid = cc.content_UUID
                                     INNER JOIN categories as cats ON cid = cats.id
                                     INNER JOIN groups AS grps ON cats.gid = grps.id
                                     INNER JOIN content_types AS ct ON c.tid = ct.id
                                     INNER JOIN download_manager AS dm
                                                ON dm.uuid = c.uuid AND dm.profile_id = '${ profile }' AND
                                                   dm.group_id = grps.id AND dm.category_id = cid AND
                                                   dm.status IN ('Installed')
                                     INNER JOIN profiles AS prfs ON profiles_contents.profile_Id = prfs.id
                            WHERE profiles_contents.profile_Id = '${ profile }'
                              AND c.classification = '${ type }'
                              AND c.published = 1
                              AND c.visible = 1
                            ORDER BY cat_sorting_id ASC, c.sorting_name ASC ` );

            const rows = sql.all ();
            if ( rows ) {
                resolve ( rows );
            }
            db.close ();
        } catch ( error ) {
            console.error ( error );
            reject ( error );
        }
    } )
}

function getContentDataForDownloadManager ( profile, uuidsList ) {
    return new Promise ( ( resolve, reject ) => {
        try {
            const Database = require ( 'better-sqlite3' );
            const db = new Database ( contentDBPath, {} );
            let sql = db
                .prepare ( `SELECT c.uuid           AS uuid,
                                   c.id             AS id,
                                   c.name           AS name,
                                   c.image          AS image,
                                   c.route          AS route,
                                   c.mimetype       AS mimetype,
                                   c.classification AS classification,
                                   cc.cat_Id        AS category_id,
                                   c.sorting_number AS sorting_number,
                                   c.sorting_name   AS sorting_name,
                                   c.tid            AS tid,
                                   c.published      AS published,
                                   c.sendable       AS sendable,
                                   c.visible        AS visible,
                                   c.deleted        AS deleted,
                                   c.date_created   AS date_created,
                                   c.version        AS version,
                                   cats.gid         AS group_id,
                                   prfs.id          AS profile_idFROM contents AS c INNER JOIN (
                                        SELECT sorting_name, MAX(version) AS MaxVersionFROM contentsGROUP BY sorting_name
                                        ) AS groupedContents
                            ON c.sorting_name = groupedContents.sorting_name AND c.version = groupedContents.MaxVersion
                                INNER JOIN profiles_contents ON c.uuid = profiles_contents.content_UUID
                                INNER JOIN categories_contents AS cc ON c.uuid = cc.content_UUID
                                INNER JOIN categories as cats ON category_id = cats.id
                                INNER JOIN profiles AS prfs ON profiles_contents.profile_Id = prfs.id
                            WHERE profiles_contents.profile_Id = '${ profile }'
                              AND c.published = 1
                              AND c.uuid IN ('${ uuidsList.join ( "','" ) }')
                            ORDER BY c.sorting_name ASC` );
            const rows = sql.all ();
            if ( rows ) {
                resolve ( rows );
            }
            db.close ();
        } catch ( error ) {
            console.error ( error );
            reject ( error );
        }
    } )
}

function doGetSearchedEmails ( queryString, date, status ) {
    return new Promise ( ( resolve, reject ) => {
        try {

            const Database = require ( 'better-sqlite3' );
            const db = new Database ( contentDBPath, {} );
            let sql = `SELECT *
                       FROM emails_manager
                       WHERE 1`

            if ( queryString !== undefined ) {
                sql += ` AND (clientName LIKE '%${ queryString }%' OR clientEmails LIKE '%${ queryString }%' OR clientEntity LIKE '%${ queryString }%' OR message LIKE '%${ queryString }%')`
            }

            if ( date !== undefined ) {
                // timestamp and unix epoch are three orders of magnitude different.
                // unixepoch is the only way sqlite will find date without using the time. :)
                sql += ` AND date(createdOn/1000, 'unixepoch') =  '${ date }'`;
            }

            if ( status !== undefined ) {
                sql += ` AND status = '${ status }'`
            }

            sql += ` ORDER BY createdOn DESC`

            const query = db.prepare ( sql )
            const rows = query.all ();
            if ( rows ) {
                const dataToSend = {
                    result: rows,
                    type: "Search"
                }
                resolve ( dataToSend );
            }
            db.close ();
        } catch ( error ) {
            console.error ( error );
            reject ( error );
        }
    } )
}

function doGetSearchedVisits ( queryString, date, status ) {
    return new Promise ( ( resolve, reject ) => {
        try {
            const Database = require ( 'better-sqlite3' );
            const db = new Database ( contentDBPath, {} );
            let sql = `SELECT *
                       FROM visits_manager
                       WHERE 1`

            if ( queryString !== undefined ) {
                sql += ` AND (clientName LIKE '%${ queryString }%' OR clientEmails LIKE '%${ queryString }%' OR clientEntity LIKE '%${ queryString }%' OR notes LIKE '%${ queryString }%')`
            }

            if ( date !== undefined ) {
                // timestamp and unix epoch are three orders of magnitude different.
                // unixepoch is the only way sqlite will find date without using the time. :)
                sql += ` AND date(createdOn/1000, 'unixepoch') =  '${ date }'`;
            }

            if ( status !== undefined ) {
                sql += ` AND status = '${ status }'`
            }

            sql += ` ORDER BY createdOn DESC`

            const query = db.prepare ( sql )
            const rows = query.all ();
            if ( rows ) {
                resolve ( { result: rows, type: 'search' } );
            }
            db.close ();
        } catch ( error ) {
            console.error ( error );
            reject ( error );
        }
    } )
}

function doGetSearchedContent ( data ) {
    return new Promise ( ( resolve, reject ) => {
            try {
                const {
                    query,
                    profile,
                    type,
                    statuses,
                    attachmentsIds,
                    subtype,
                    visitActive,
                    group,
                    businessUnit,
                    allDBContentTypes,
                    allDBGroupsForProfile
                } = data;

                const markdownRegex = '/(\*)(.*?)(\*)\g'
                //console.log ( 'subtype ', subtype )
                const Database = require ( 'better-sqlite3' );
                const db = new Database ( contentDBPath, {} );
                let sql = `SELECT DISTINCT c.uuid               AS uuid,
                                           c.id                 AS id,
                                           c.name               AS title,
                                           c.image              AS image,
                                           c.route              AS route,
                                           c.classification     AS type,
                                           c.visible            AS visible,
                                           cc.cat_Id            AS cid,
                                           c.sorting_number     AS sorting_number,
                                           c.sorting_name       AS sorting_name,
                                           c.tid                AS tid,
                                           c.parent_content_id  AS parent_content_id,
                                           c.business_unit_id   AS business_unit_id,
                                           cats.sorting_number  AS cat_sorting_id,
                                           cats.name            AS category_title,
                                           cats.image           AS category_image,
                                           cats.gid             AS group_id,
                                           grps.sorting_number  AS group_sorting_id,
                                           grps.name            AS group_title,
                                           grps.image           AS group_color,
                                           prfs.id              AS profile_id,
                                           prfs.name            AS profile_name,
                                           ct.id                AS ct_id,
                                           ct.sorting_key       AS ct_sortingKey,
                                           ct.name              AS ct_name,
                                           ct.color             AS ct_color,
                                           dm.uuid              AS dm_uuid,
                                           dm.file_uuid         AS file_uuid,
                                           dm.profile_id        AS dm_profileId,
                                           dm.group_id          AS dm_groupId,
                                           dm.category_id       AS dm_catId,
                                           dm.installation_date AS dm_installationDate,
                                           dm.package_date      AS dm_packageDate,
                                           dm.status            AS status
                           FROM contents AS c
                                    INNER JOIN (SELECT uuid, MAX(version) AS MaxVersion FROM contents GROUP BY uuid) AS groupedContents
                                               ON c.uuid = groupedContents.uuid AND
                                                  c.version = groupedContents.MaxVersion
                                    INNER JOIN profiles_contents ON c.uuid = profiles_contents.content_UUID
                                    INNER JOIN categories_contents AS cc ON c.uuid = cc.content_UUID
                                    INNER JOIN categories as cats ON cc.cat_Id = cats.id
                                    INNER JOIN groups AS grps ON cats.gid = grps.id
                                    INNER JOIN content_types AS ct ON c.tid = ct.id
                                    INNER JOIN download_manager AS dm
                                               ON dm.uuid = c.uuid AND
                                                  dm.profile_id = '${ profile }' AND
                                                  dm.group_id = grps.id AND
                                                  dm.category_id = cc.cat_Id AND
                                                  dm.status IN ('${ statuses.join ( "','" ) }')
                                    INNER JOIN profiles AS prfs ON profiles_contents.profile_Id = prfs.id
                           WHERE profiles_contents.profile_id = '${ profile }'`;
                if ( attachmentsIds !== undefined ) {
                    sql += `AND c.uuid IN ('${ attachmentsIds.join ( "','" ) }')`;
                }
                if ( subtype !== undefined ) {
                    const presentationsContent = [
                        'presentation',
                        'demo',
                        'main-presentation',
                        'vdemo',
                        'story/brochure'
                    ];

                    const calculatorsContent = [
                        'calculator',
                        'calculator'
                    ];

                    const documentsContent = [
                        'brochure',
                        'case-study',
                        'clinical-paper',
                        'clinical-publication',
                        'ordering',
                        'publication',
                        'sales-aid',
                        'spec',
                    ];

                    switch ( subtype ) {
                        case 'presentation':
                            sql += `AND c.tid in('${ presentationsContent.join ( "','" ) }')`;
                            break;
                        case 'calculator':
                            sql += `AND c.tid in('${ calculatorsContent.join ( "','" ) }')`;
                            break;
                        case 'documents':
                            sql += `AND c.tid in('${ documentsContent.join ( "','" ) }')`;
                            break;
                        default:
                            console.info ( 'Subtype is ', subtype );
                    }
                }
                if ( !type.includes ( "all" ) ) {
                    sql += ` AND c.tid in('${ type.join ( "','" ) }')`;
                }
                if ( type.includes ( "all" ) ) {
                    sql += ` AND c.tid in('${ allDBContentTypes.join ( "','" ) }')`;
                }
                if ( group !== 'all' ) {
                    sql += ` AND grps.sorting_number LIKE '%${ group }%'`;
                }
                if ( !businessUnit.includes ( "all" ) ) {
                    sql += ` AND grps.id in('${ businessUnit.join ( "','" ) }')`;
                }
                if ( businessUnit.includes ( "all" ) ) {
                    sql += ` AND grps.id in('${ allDBGroupsForProfile.join ( "','" ) }')`;
                }
                if ( query !== '' ) {
                    sql += ` AND replace(c.name, '*', '')  LIKE '%${ query }%'`;
                }
                if ( visitActive === true ) {
                    sql += ` AND c.visible = 1`;
                }
                sql += ` ORDER BY cat_sorting_id ASC, c.sorting_name ASC`;
                const SQLquery = db.prepare ( sql );
                const rows = SQLquery.all ();
                if ( rows ) {
                    resolve ( rows );
                }
                db.close ();
            } catch
                ( error ) {
                console.error ( error );
                reject ( error );
            }
        }
    )
}

function doUpdateUserSettings ( key, value ) {
    return new Promise ( ( resolve, reject ) => {
        try {
            //console.log( 'Received in doUpdateUserSettings', key, value )
            const Database = require ( 'better-sqlite3' );
            const db = new Database ( contentDBPath, {} );
            const sql = `UPDATE user_settings
                         SET value = ?
                         WHERE key = ?`
            const stmt = db.prepare ( sql );

            const info = stmt.run ( value, key );
            // noinspection JSUnresolvedVariable
            resolve ( true );
            db.close ();
        } catch ( error ) {
            console.error ( 'error in doUpdateUserSettings: ', error );
            reject ( error );
        }
    } )
}

function doUpdateEmailStatus ( uuid, status ) {
    return new Promise ( ( resolve, reject ) => {
        try {
            const Database = require ( 'better-sqlite3' );
            const db = new Database ( contentDBPath, {} );
            const stmt = db
                .prepare ( `UPDATE emails_manager
                            SET status = ?
                            WHERE uuid = ?` );
            stmt.run ( status, uuid );
            resolve ( true );
            db.close ();
        } catch ( error ) {
            console.log ( error );
            reject ( false )
        }
        //console.log( 'Received in doUpdateUserSettings', key, value )
    } )
}

//TODO: move this query to DownloadManger entity
function doGetUpdatesList () {
    return new Promise ( ( resolve, reject ) => {
        try {
            const Database = require ( 'better-sqlite3' );
            const db = new Database ( contentDBPath, {} );
            let sql = db
                .prepare ( `SELECT dm.id                AS id,
                                   dm.uuid              AS uuid,
                                   dm.name              AS name,
                                   dm.profile_id        AS profile_id,
                                   dm.group_id          AS group_id,
                                   dm.category_id       AS category_id,
                                   dm.classification    AS classification,
                                   dm.installation_date AS installation_date,
                                   dm.notification_date AS notification_date,
                                   dm.status            AS status
                            FROM download_manager AS dm
                                     INNER JOIN (SELECT id, MAX(version) AS MaxVersion
                                                 FROM download_manager
                                                 GROUP BY id) AS groupedUpdates
                                                ON dm.id = groupedUpdates.id
                                     INNER JOIN categories AS cats ON dm.category_id = cats.id
                                     INNER JOIN groups AS grps ON cats.gid = grps.id
                            WHERE dm.status = 'Postponed'
                            ORDER BY dm.id ASC` );

            const rows = sql.all ();
            if ( rows ) {
                resolve ( rows );
            }
            db.close ();
        } catch ( error ) {
            console.error ( error );
            reject ( error );
        }
    } )
}

function doGetPackagesList ( currentProfile ) {
    return new Promise ( ( resolve, reject ) => {
        try {
            const Database = require ( 'better-sqlite3' );
            const db = new Database ( contentDBPath, {} );
            let sql = `SELECT dm.id                AS id,
                              dm.uuid              AS uuid,
                              dm.name              AS name,
                              grps.name            AS group_name,
                              cats.name            AS category_name,
                              dm.classification    AS classification,
                              dm.installation_date AS installation_date,
                              dm.notification_date AS notification_date,
                              dm.status            AS status
                       FROM download_manager AS dm
                                INNER JOIN (SELECT uuid, MAX(version) AS MaxVersion
                                            FROM download_manager
                                            GROUP BY uuid) AS groupedUpdates
                                           ON dm.uuid = groupedUpdates.uuid AND dm.status != 'Report_To_Backend' 
                                            INNER JOIN categories AS cats
                       ON dm.category_id = cats.id
                           INNER JOIN groups AS grps ON cats.gid = grps.id `

            if ( currentProfile ) {
                sql += `WHERE profile_id = '${ currentProfile }'`
            }
            sql += `ORDER BY dm.installation_date DESC`;

            const query = db.prepare ( sql )
            const rows = query.all ();
            if ( rows ) {
                resolve ( rows );
            }
            db.close ();
        } catch ( error ) {
            console.error ( error );
            reject ( error );
        }
    } )
}

function doFindMyUUID ( data ) {
    return new Promise ( ( resolve, reject ) => {
        try {
            const Database = require ( 'better-sqlite3' );
            const db = new Database ( contentDBPath, {} );
            let sql = db
                .prepare ( `SELECT *
                            FROM contents
                                     INNER JOIN profiles_contents ON contents.uuid = profiles_contents.content_UUID
                            WHERE profiles_contents.profile_id = ?
                              AND contents.sorting_name = ?` );// + data.profileId
            const rows = sql.all ( data.profileId, data.id );
            if ( rows ) {
                resolve ( rows );
            }
            db.close ();
        } catch ( error ) {
            console.error ( error );
            reject ( error );
        }
    } )
}

function deleteItemWithUUID ( data ) {
    return new Promise ( ( resolve, reject ) => {
        try {
            const Database = require ( 'better-sqlite3' );
            const db = new Database ( contentDBPath, {} );
            const tableName = data.tableName;
            const uuid = data.uuid;

            let del = db.prepare ( `DELETE
                                    FROM ${ tableName }
                                    WHERE uuid = '${ uuid }'` );
            del.run ();
            resolve ( true )
            // db.close ();

        } catch ( error ) {
            console.error ( error );
            reject ( error );
        }
    } )
}

function deleteItemFromRelationalTable ( data ) {
    return new Promise ( ( resolve, reject ) => {
        try {
            const Database = require ( 'better-sqlite3' );
            const db = new Database ( contentDBPath, {} );
            const tableName = data.tableName;
            const itemProperty = data.itemProperty;
            // const itemValue = data.itemValue;
            const itemProfile = data.itemProfile || undefined;

            let sql = `DELETE
                       FROM ${ tableName }
                       WHERE ${ itemProperty } = ?`;
            if ( itemProfile ) {
                sql += ` AND profile_id = ? `;
            }

            const del = db.prepare ( sql );
            del.run ();
            // db.close();
            resolve ( true );
        } catch ( error ) {
            console.error ( error );
            reject ( error );
        }
    } )
}

function getItemsFromTableByField ( data ) {
    return new Promise ( ( resolve, reject ) => {
        try {
            const tableName = data.tableName;
            const sentName = data.fieldName;
            const sentValues = data.fieldValues;
            const Database = require ( 'better-sqlite3' );
            const db = new Database ( contentDBPath, {} );
            let sql = db
                .prepare ( `SELECT *
                            FROM ${ tableName }
                            WHERE ${ sentName } in ('${ sentValues.join ( "','" ) }')` );

            const rows = db.all ();
            if ( rows ) {
                resolve ( rows )
            }
            db.close ();

        } catch ( error ) {
            console.error ( error );
            reject ( error );
        }

    } )
}

function saveContent ( content ) {
    return doInsertIntoDB ( 'contents', content )
}

function getDataFromDownloadManager ( profileId, uuids ) {
    return new Promise ( ( resolve, reject ) => {
        try {
            const Database = require ( 'better-sqlite3' );
            const db = new Database ( contentDBPath, {} );
            let sql = db
                .prepare ( `SELECT *
                            FROM download_manager
                            WHERE profile_Id = '${ profileId }'
                              AND uuid in ('${ uuids.join ( "','" ) }')` );

            const rows = sql.all ();
            if ( rows ) {
                resolve ( rows );
            }
            db.close ();
        } catch ( error ) {
            console.error ( error );
            reject ( error );
        }
    } )
}

function setContentAsDeleted ( uuid ) {
    return new Promise ( ( resolve, reject ) => {
        try {
            const Database = require ( 'better-sqlite3' );
            const db = new Database ( contentDBPath, {} );
            let sql = db
                .prepare ( `UPDATE contents
                            SET deleted = 1
                            WHERE uuid = ?` )
            const rows = sql.all ( uuid );
            resolve ( rows );
            db.close ();
        } catch ( error ) {
            console.error ( error );
            reject ( error );
        }
    } )
}

function setContentsAsDeleted ( uuids ) {
    return new Promise ( ( resolve, reject ) => {
        try {
            const Database = require ( 'better-sqlite3' );
            const db = new Database ( contentDBPath, {} );
            let sql = db
                .prepare ( `UPDATE contents
                            SET deleted = 1
                            WHERE uuid in ('${ uuids.join ( "','" ) }')` );

            const rows = sql.all ();
            resolve ( rows );
            db.close ();
        } catch ( error ) {
            console.error ( error );
            reject ( error );
        }
    } )
}

function updateItemStatusInDm ( data ) {

    return new Promise ( ( resolve, reject ) => {
        try {
            const Database = require ( 'better-sqlite3' );
            const db = new Database ( contentDBPath, {} );

            switch ( data.classification ) {
                case 'image':
                    const imgStmt = db
                        .prepare ( `UPDATE download_manager
                                    SET status = ?
                                    WHERE uuid = ?
                                      AND category_id = ?
                                      AND profile_id = ?` );
                    imgStmt.run ( data.status, data.uuid, data.category_id, data.profile_id );
                    resolve ( true );
                    break;
                default:
                    const stmt = db
                        .prepare ( `UPDATE download_manager
                                    SET status = ?
                                    WHERE uuid = ? ` );
                    stmt.run ( data.status, data.uuid );
                    resolve ( true );
                    break;
            }
            db.close ();

        } catch ( error ) {
            console.log ( 'Error while updating status to', data.status, 'on email with uuid: ', data.uuid, error )
            console.error ( error );
            reject ( error );
        }
    } )
}

function updateContentInDB ( contentsForUpdating ) {

    return new Promise ( ( resolve, reject ) => {
        updateCategories_ContentsInDB ( contentsForUpdating )
            .then ( ( result ) => {
                updateContentsInDB ( contentsForUpdating )
                    .then ( ( result ) => {
                        updateDownloadManagerInDB ( contentsForUpdating )
                            .then ( ( result ) => {
                                resolve ( true );  // TODO: Maybe substitute all this calls with async/await where updateContentInDB is being called?
                            } )
                            .catch ( error => {
                                console.error ( 'Error updating download_manager' );
                                reject ( error );
                            } )
                    } )
                    .catch ( error => {
                        console.error ( 'Error updating contents' );
                        reject ( error );
                    } )
            } )
            .catch ( error => {
                console.error ( 'Error updating categories_contents' );
                reject ( error );
            } )
    } )
}

function updateCategories_ContentsInDB ( contentsForUpdating ) {
    return new Promise ( ( resolve, reject ) => {
        try {
            const Database = require ( 'better-sqlite3' );
            const db = new Database ( contentDBPath, {} );

            for ( let content of contentsForUpdating ) {
                const sql = db
                    .prepare ( `UPDATE OR IGNORE categories_contents
                                SET cat_Id = ?
                                WHERE content_UUID = ?` )
                sql.run (
                    content.category_id,
                    content.uuid
                );
                resolve ( true );
                db.close ();
            }
        } catch ( error ) {
            console.error ( error );
            reject ( error );
        }
    } )
}

function updateContentsInDB ( contentsForUpdating ) {
    return new Promise ( ( resolve, reject ) => {
        try {
            const Database = require ( 'better-sqlite3' );
            const db = new Database ( contentDBPath, {} );

            for ( let content of contentsForUpdating ) {
                const sql = db
                    .prepare ( `UPDATE contents
                                SET name           = ?,
                                    sorting_name   = ?,
                                    classification = ?,
                                    mimetype       = ?,
                                    image          = ?,
                                    route          = ?,
                                    date_created   = ?,
                                    version        = ?,
                                    published      = ?,
                                    visible        = ?,
                                    sendable       = ?,
                                    deleted        = ?,
                                    sorting_number = ?,
                                    tid            = ?
                                WHERE uuid = ?` )
                sql.run (
                    content.name,
                    content.sorting_name,
                    content.classification,
                    content.mimetype,
                    '/' + content.route,
                    content.route,
                    content.date_created,
                    content.version,
                    content.published,
                    content.visible,
                    content.sendable,
                    content.deleted,
                    content.sorting_number,
                    content.tid,
                    content.uuid
                );
                resolve ( true );
                db.close ();
            }
        } catch ( error ) {
            console.error ( error );
            reject ( error );
        }
    } )
}

function updateDownloadManagerInDB ( contentsForUpdating ) {
    return new Promise ( ( resolve, reject ) => {
        try {
            const Database = require ( 'better-sqlite3' );
            const db = new Database ( contentDBPath, {} );

            for ( let content of contentsForUpdating ) {
                const sql = db
                    .prepare ( `UPDATE download_manager
                                SET name                = ?,
                                    group_id            = ?,
                                    category_id         =?,
                                    file_uuid           = ?,
                                    filename            = ?,
                                    url                 = ?,
                                    should_rename       = ?,
                                    status              = ?,
                                    version             = ?,
                                    package             = ?,
                                    classification      = ?,
                                    notification_date   = ?,
                                    package_date        = ?,
                                    installation_date   = ?,
                                    uninstallation_date = ?
                                WHERE uuid = ?
                                  AND profile_id = ?` )
                sql.run (
                    content.name,
                    content.group_id,
                    content.category_id,
                    content.file_uuid,
                    content.filename,
                    content.url,
                    content['rename'],
                    'Installed',
                    content.version,
                    JSON.stringify ( content ),
                    content.classification,
                    '',
                    '',
                    Date.now (),
                    '',
                    content.uuid,
                    content.profile_id
                );
                resolve ( true );
                db.close ();
            }
        } catch ( error ) {
            console.error ( error );
            reject ( error );
        }
    } )
}

function updateDownloadManagerForInstallingFiles ( contentsForInstallingFiles ) {

    return new Promise ( ( resolve, reject ) => {
        try {
            const Database = require ( 'better-sqlite3' );
            const db = new Database ( contentDBPath, {} );
            for ( let contentFile of contentsForInstallingFiles ) {
                const sql = db
                    .prepare ( `UPDATE download_manager
                                SET status        = ?,
                                    file_uuid     = ?,
                                    filename      = ?,
                                    url           = ?,
                                    should_rename = ?
                                WHERE uuid = ?
                                  AND profile_id = ?
                                  AND category_id = ?` );

                sql.run (
                    'Pending',
                    contentFile.file_uuid,
                    contentFile.filename,
                    contentFile.url,
                    contentFile['rename'],
                    contentFile.uuid,
                    contentFile.profile_id,
                    contentFile.category_id
                );
            }
            resolve ( true );
            db.close ();

        } catch ( error ) {
            console.error ( error );
            reject ( error );
        }
    } )
}

function asTransaction ( begin, commit, rollback, db, func ) {
    return function () {
        begin.run ();
        try {
            func ();
            commit.run ();
        } finally {
            if ( db.inTransaction ) rollback.run ();
        }
    };
}

function removeGroupsUniqueName () {
    const Database = require ( 'better-sqlite3' );
    const db = new Database ( contentDBPath, {} );
    const begin = db.prepare ( 'BEGIN' );
    const commit = db.prepare ( 'COMMIT' );
    const rollback = db.prepare ( 'ROLLBACK' );

// Higher order function - returns a function that always runs in a transaction

    const removeForeignKeys = `PRAGMA foreign_keys=off`;
    const restoreForeignKeys = `PRAGMA foreign_keys=on`;
    const renameCategoriesQuery = 'ALTER TABLE categories RENAME TO _categories_old';
    const renameGroupsQuery = 'ALTER TABLE groups RENAME TO _groups_old';
    const renameCatsContentsQuery = 'ALTER TABLE categories_contents RENAME TO _categories_contents_old';
    const recreateGroupsQuery = 'CREATE TABLE groups (\n' +
        '        id             TEXT,\n' +
        '        name           TEXT not null,\n' +
        '        sorting_name   TEXT not null,\n' +
        '        image          BLOB,\n' +
        '        date_created   DATE not null,\n' +
        '        published      BOOL not null,\n' +
        '        deleted        BOOL not null,\n' +
        '        sorting_number INTEGER,\n' +
        '        hash           TEXT not null,\n' +
        '        primary key (id),\n' +
        '        unique (id),\n' +
        '        unique (sorting_name)\n' +
        '    )';
    const insertDataIntoGroupsQuery = 'INSERT INTO groups SELECT * FROM _groups_old';
    const dropGroupsOldQuery = 'DROP TABLE _groups_old';
    const recreateCategoriesQuery = 'CREATE TABLE categories (\n' +
        '        id             TEXT,\n' +
        '        name           TEXT not null,\n' +
        '        sorting_name   TEXT not null,\n' +
        '        image          BLOB not null,\n' +
        '        date_created   DATE not null,\n' +
        '        published      BOOL not null,\n' +
        '        gid            TEXT,\n' +
        '        sorting_number INTEGER,\n' +
        '        hash           TEXT not null,\n' +
        '        primary key (id),\n' +
        '        unique (id)\n' +
        '\t\tforeign key (gid) references groups(id)\n' +
        '    )';
    const recreateCatsContentsQuery = ' create table categories_contents\n    (content_UUID TEXT not null, cat_Id int  not null, constraint categories_contents_pk primary key (cat_Id, content_UUID), foreign key (cat_Id) references categories, constraint categories_contents_contents_uuid_fk foreign key (content_UUID) references contents (uuid) )'
    const insertDataIntoCategoriesQuery = 'INSERT INTO categories SELECT * FROM _categories_old';
    const insertDataIntoCatsContentsQuery = 'INSERT INTO categories_contents SELECT * FROM _categories_contents_old';
    const dropCategoriesOldQuery = 'DROP TABLE _categories_old';
    const dropCatsContentsOldQuery = 'DROP TABLE _categories_contents_old';

    const removeConstraints = asTransaction ( begin, commit, rollback, db, function () {
        const renameCategories = db.prepare ( renameCategoriesQuery );
        renameCategories.run ();
        const renameGroups = db.prepare ( renameGroupsQuery );
        renameGroups.run ();
        const renameCatsContents = db.prepare ( renameCatsContentsQuery );
        renameCatsContents.run ();
        const recreateGroups = db.prepare ( recreateGroupsQuery );
        recreateGroups.run ();
        const insertDataIntoGroups = db.prepare ( insertDataIntoGroupsQuery );
        insertDataIntoGroups.run ();
        const dropGroupsOld = db.prepare ( dropGroupsOldQuery );
        dropGroupsOld.run ();
        const recreateCategories = db.prepare ( recreateCategoriesQuery );
        recreateCategories.run ();
        const insertDataIntoCategories = db.prepare ( insertDataIntoCategoriesQuery );
        insertDataIntoCategories.run ();
        const dropCategoriesOld = db.prepare ( dropCategoriesOldQuery );
        dropCategoriesOld.run ();
        const recreateCatsContents = db.prepare ( recreateCatsContentsQuery );
        recreateCatsContents.run ();
        const insertDataIntoCatsContents = db.prepare ( insertDataIntoCatsContentsQuery );
        insertDataIntoCatsContents.run ();
        const dropCatsContentsOld = db.prepare ( dropCatsContentsOldQuery );
        dropCatsContentsOld.run ();
    } );

    return new Promise ( ( resolve, reject ) => {
        try {
            db.exec ( removeForeignKeys );
            removeConstraints ();
            db.exec ( restoreForeignKeys );
            resolve ( true );
        } catch ( error ) {
            reject ( error )
        }
    } )
}


module.exports = methods;

