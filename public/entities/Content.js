// INSERT HERE RELATION BETWEEN PROFILE AND CONTENT (content_contents)
const { databasePath } = require ( "../constants/AppData" );
const Database = require ( 'better-sqlite3' );

const createQueryContent = "create table contents ( id INTEGER, uuid TEXT not null, name TEXT not null, sorting_name TEXT not null, classification TEXT not null, mimetype TEXT, image TEXT, route BLOB not null, date_created DATE not null, version INTEGER not null, published BOOL not null, visible BOOL not null, sendable BOOL not null, deleted BOOL not null, sorting_number INTEGER, tid TEXT, primary key (id autoincrement), unique (id), unique (uuid), foreign key (tid) references content_types on update restrict on delete restrict );"

class Content {
    // make it like DoGetSearchedContent
    static allContent () {
        return new Promise ( ( resolve, reject ) => {
            try {
                const db = new Database ( databasePath, {} );
                const stmt = db.prepare ( 'SELECT * FROM contents' )
                const rows = stmt.all ();
                resolve ( rows );
                db.close ();
            } catch ( error ) {
                console.error ( error );
                reject ( error );
            }
        } )
    }

    // add a method for getAllVisuals
    // add a method for getAllLibraries
    // add a method for searchContent
    // add a method for findContentByUUID
    // add a method for findContentBySortingName

    static findMyInfo ( data ) {
        return new Promise ( ( resolve, reject ) => {
            const { group, profile, id, type, navigationLevel } = data;
            let classification = "";
            switch(type){
                case "hypeviewer":
                    classification = "visuals"
                    break;

                case "pdfviewer":
                default:
                    classification = "library"
                    break;
            }
            try {
                const db = new Database ( databasePath, {} );
                let sql = `SELECT contents.*, c.id, c.gid, pc.profile_Id
                           FROM contents
                                    INNER JOIN categories_contents cc ON contents.uuid = cc.content_UUID
                                    INNER JOIN categories c ON c.id = cc.cat_Id
                                    INNER JOIN profiles_contents pc ON contents.uuid = pc.content_UUID
                           WHERE `;
                if ( navigationLevel === "first" ) {
                    sql = `${ sql } contents.route = ? `
                } else if ( navigationLevel === "second" ) {
                    sql = `${ sql } contents.sorting_name = ? `
                }
                sql = `${ sql } AND contents.classification = ? AND c.gid = ? AND pc.profile_Id = ? `
                const stmt = db.prepare ( sql )
                const rows = stmt.all ( id, classification, group, profile );
                resolve ( rows );
                db.close ();
            } catch ( error ) {
                console.error ( error );
                reject ( error );
            }
        } )

    }

    static findContentRouteForUuid ( uuid ) {
        return new Promise ( ( resolve, reject ) => {
            try {
                const db = new Database ( databasePath, {} );
                const stmt = db.prepare ( 'SELECT route FROM contents WHERE uuid = ? ' )
                const rows = stmt.all ( uuid );
                resolve ( rows );
                db.close ();
            } catch ( error ) {
                console.error ( error );
                reject ( error );
            }
        } )
    }

    static findMyAttachmentInfo ( data ) {
        return new Promise ( ( resolve, reject ) => {
            const { profile, id, group, type } = data;
            let classification = "";
            switch ( type ) {
                case "hypeviewer":
                    classification = "visuals"
                    break;

                case "pdfviewer":
                default:
                    classification = "library"
                    break;
            }
            try {
                const db = new Database ( databasePath, {} );
                const stmt = db.prepare ( '' +
                    'SELECT contents.uuid,                          ' +
                    '   contents.sorting_name,                      ' +
                    '   contents.route,                             ' +
                    '   contents.name,                              ' +
                    '   contents.tid,                               ' +
                    '   c.id as cid,                                ' +
                    '   c.gid as gid,                               ' +
                    '   ct.sorting_key as icon,                     ' +
                    '   pc.profile_Id  as profile_id                ' +
                    '   FROM contents                               ' +
                    '       INNER JOIN profiles_contents pc         ' +
                    '           ON contents.uuid = pc.content_UUID  ' +
                    '       INNER JOIN content_types ct             ' +
                    '               ON contents.tid = ct.id         ' +
                    '       INNER JOIN categories_contents cc       ' +
                    '           ON contents.uuid = cc.content_UUID  ' +
                    '       INNER JOIN categories c                 ' +
                    '           ON c.id = cc.cat_Id                 ' +
                    '   WHERE                                       ' +
                    '       contents.route = ?                      ' +
                    '   AND                                         ' +
                    '       contents.classification = ?             ' +
                    '   AND                                         ' +
                    '       c.gid = ?                               ' +
                    '   AND                                         ' +
                    '       pc.profile_Id = ?                       '
                )
                const rows = stmt.all ( id, classification, group, profile );
                resolve ( rows );
                db.close ();
            } catch ( error ) {
                console.error ( error );
                reject ( error );
            }
        } )

    }

    static findAllContentTypesForProfile = ( profile ) => {
        return new Promise ( ( resolve, reject ) => {
            try {
                if ( !profile ) {
                    reject ( 'Please provide user profile' );
                } else {
                    const db = new Database ( databasePath, {} );
                    const stmt = db.prepare ( 'SELECT DISTINCT c.tid, ct.name, ct.sorting_key FROM contents AS c INNER JOIN content_types AS ct INNER JOIN profiles_contents AS pc WHERE c.tid = ct.id AND c.uuid = pc.content_UUID AND pc.profile_Id = ? ORDER BY c.tid ASC' )
                    const rows = stmt.all ( profile );
                    resolve ( rows )
                    db.close ();
                }
            } catch ( error ) {
                console.error ( error );
                reject ( error );
            }
        } )
    }

    static find ( uuid ) {
        return new Promise ( ( resolve, reject ) => {
            try {
                if ( !uuid ) {
                    reject ( 'Please provide an uuid' );
                } else {
                    const db = new Database ( databasePath, {} );
                    const stmt = db.prepare ( 'SELECT * FROM contents WHERE uuid = ?' )
                    const rows = stmt.all ( uuid );
                    resolve ( rows )
                    db.close ();
                }
            } catch ( error ) {
                console.error ( error );
                reject ( error );
            }
        } )
    }

    static findByClassification ( classification ) {
        return new Promise ( ( resolve, reject ) => {
            try {
                const db = new Database ( databasePath, {} );
                const contentQuery = 'SELECT * FROM contents ' +
                    'WHERE classification = ?';
                const stmtContent = db.prepare ( contentQuery );
                const rows = stmtContent.all ( classification );
                resolve ( rows );
                db.close ();
            } catch ( error ) {
                console.error ( error );
                reject ( error );
            }
        } )
    }

    static create ( data ) {
        return new Promise ( ( resolve, reject ) => {
            try {
                const db = new Database ( databasePath, {} );
                const { clonedContents } = data;
                const contentsWithoutImages = clonedContents.filter ( item => item.classification !== "image" )
                const contentQuery = "INSERT OR IGNORE INTO contents(uuid, name, sorting_name, classification, mimetype, image, route, date_created, version, published, visible, sendable, deleted, sorting_number, tid, parent_content_id, business_unit_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?,?, ?, ?, ?, ?, ?, ?, ?, ? )";
                const stmtContent = db.prepare ( contentQuery );

                const insertManyContents = db.transaction ( ( list ) => {
                    for ( const item of list ) {
                        const {
                            uuid,
                            name,
                            sorting_name,
                            classification,
                            mimetype,
                            image,
                            route,
                            date_created,
                            version,
                            published,
                            visible,
                            sendable,
                            deleted,
                            sorting_number,
                            tid,
                            parent_content_id,
                            business_unit_id
                        } = item;
                        stmtContent.run ( uuid, name, sorting_name, classification, mimetype, image, route, date_created, version, published ? 1 : 0, visible ? 1 : 0, sendable ? 1 : 0, deleted ? 1 : 0, sorting_number, tid, parent_content_id, business_unit_id );
                    }
                } )

                insertManyContents.immediate ( contentsWithoutImages );
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
                const { name, uuid } = data;
                if ( !name || !uuid ) {
                    reject ( 'Please provide a name and uuid' );
                } else {
                    const db = new Database ( databasePath, {} );
                    const stmt = db.prepare ( 'UPDATE  contents SET name= ?  WHERE uuid = ?' );
                    const info = stmt.run ( name, uuid );

                    resolve ( info.lastInsertRowid );
                    db.close ();
                }
            } catch ( error ) {
                console.error ( error );
                reject ( error );
            }

        } )
    }

    static updateRoute ( data ) {
        return new Promise ( ( resolve, reject ) => {
            try {
                const { route, uuid, name, sorting_name } = data;
                if ( !route || !uuid ) {
                    reject ( 'Please provide a route and uuid' );
                } else {
                    const db = new Database ( databasePath, {} );
                    const stmt = db.prepare ( 'UPDATE  contents SET route= ?  WHERE uuid = ?' );
                    const info = stmt.run ( route, uuid );
                    const contentToReturn = {
                        lastInsertRowid: info.lastInsertRowid,
                        uuid,
                        route,
                        sorting_name,
                        name
                    }
                    resolve ( contentToReturn );
                    db.close ();
                }
            } catch ( error ) {
                console.error ( error );
                reject ( error );
            }

        } )
    }

    static updateBulk ( data ) {
        return new Promise ( ( resolve, reject ) => {
            try {
                const db = new Database ( databasePath, {} );
                const { clonedContentsForUpdating } = data;
                const contentsWithoutImages = clonedContentsForUpdating.filter ( item => item.classification !== "image" )
                const contentQuery = "UPDATE contents SET " +
                    "name = ?, " +
                    "sorting_name = ?, " +
                    "classification = ?, " +
                    "mimetype = ?, " +
                    "image = ?, " +
                    "route = ?, " +
                    "date_created = ?, " +
                    "version = ?, " +
                    "published = ?, " +
                    "visible = ?, " +
                    "sendable = ?, " +
                    "deleted = ?, " +
                    "sorting_number = ?, " +
                    "tid = ?, " +
                    "parent_content_id = ?, " +
                    "business_unit_id = ? " +
                    "WHERE uuid  = ?";
                const stmtContent = db.prepare ( contentQuery );

                const updateManyContents = db.transaction ( ( list ) => {
                    for ( const item of list ) {
                        const {
                            name,
                            sorting_name,
                            classification,
                            mimetype,
                            image,
                            route,
                            date_created,
                            version,
                            published,
                            visible,
                            sendable,
                            deleted,
                            sorting_number,
                            tid,
                            parent_content_id,
                            business_unit_id,
                            uuid
                        } = item;
                        stmtContent.run ( name, sorting_name, classification, mimetype, image, route, date_created, version, published ? 1 : 0, visible ? 1 : 0, sendable ? 1 : 0, deleted ? 1 : 0, sorting_number, tid, parent_content_id ? parent_content_id : "", business_unit_id ? business_unit_id : "other", uuid );
                    }
                } )

                updateManyContents.immediate ( contentsWithoutImages );
                resolve ( true );
                db.close ();
            } catch ( error ) {
                console.error ( error );
                reject ( error );
            }
        } )
    }

    static delete ( uuid ) {
        return new Promise ( ( resolve, reject ) => {

            //add db.serialize and a loop over an array of uuids
            try {
                if ( !uuid ) {
                    reject ( 'Please provide an uuid' );
                } else {
                    // add call for deleting content from categories_contents where uuid in (from relations/Categories_Contents)
                    // add call run for deleting content from profiles_contents where uuid in (from relations/Profiles_Contents)
                    const db = new Database ( databasePath, {} );
                    const stmt = db.prepare ( 'DELETE FROM contents WHERE uuid = ?' )
                    const info = stmt.run ( uuid );
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

module.exports = Content;
