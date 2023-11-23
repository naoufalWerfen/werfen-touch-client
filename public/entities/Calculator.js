// INSERT HERE RELATION BETWEEN PROFILE AND CONTENT (content_contents)
const { databasePath } = require ( "../constants/AppData" );
const Database = require ( 'better-sqlite3' );

const createQueryContent = "create table contents ( id INTEGER, uuid TEXT not null, name TEXT not null, sorting_name TEXT not null, classification TEXT not null, mimetype TEXT, image TEXT, route BLOB not null, date_created DATE not null, version INTEGER not null, published BOOL not null, visible BOOL not null, sendable BOOL not null, deleted BOOL not null, sorting_number INTEGER, tid TEXT, primary key (id autoincrement), unique (id), unique (uuid), foreign key (tid) references content_types on update restrict on delete restrict );"

class Calculator {
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
            const { group, profile, id, type } = data;
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
                    'SELECT contents.*,                             ' +
                    '   c.id,                                       ' +
                    '   c.gid,                                      ' +
                    '   pc.profile_Id                               ' +
                    '   FROM contents                               ' +
                    '       INNER JOIN categories_contents cc       ' +
                    '           ON contents.uuid = cc.content_UUID  ' +
                    '       INNER JOIN categories c                 ' +
                    '           ON c.id = cc.cat_Id                 ' +
                    '       INNER JOIN profiles_contents pc         ' +
                    '           ON contents.uuid = pc.content_UUID  ' +
                    '   WHERE                                       ' +
                    '       contents.sorting_name = ?               ' +
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

    static create ( data ) {
        return new Promise ( ( resolve, reject ) => {
            try {
                const db = new Database ( databasePath, {} );
                const { clonedContents } = data;
                const contentsWithoutImages = clonedContents.filter ( item => item.classification !== "image" )
                const contentQuery = "INSERT OR IGNORE INTO contents(uuid, name, sorting_name, classification, mimetype, image, route, date_created, version, published, visible, sendable, deleted, sorting_number, tid) VALUES (?, ?, ?, ?, ?, ?, ?, ?,?, ?, ?, ?, ?, ?, ?)";
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
                            tid
                        } = item;
                        stmtContent.run ( uuid, name, sorting_name, classification, mimetype, image, route, date_created, version, published ? 1 : 0, visible ? 1 : 0, sendable ? 1 : 0, deleted ? 1 : 0, sorting_number, tid );
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

    static delete ( uuid ) {
        return new Promise ( ( resolve, reject ) => {
            try {
                if ( !uuid ) {
                    reject ( 'Please provide an id' );
                } else {
                    const db = new Database ( databasePath, {} );
                    const stmts = [ 'DELETE FROM profiles_contents WHERE content_UUID = @uuid;',
                        'DELETE FROM categories_contents WHERE content_UUID = @uuid;',
                        'DELETE FROM contents WHERE uuid = @uuid;' ].map ( ( stmt ) => db.prepare ( stmt ) )
                    const myTransaction = db.transaction ( ( uuid ) => {
                        for ( const stmt of stmts ) {
                            stmt.run ( uuid );
                        }
                    } );
                    myTransaction ( { uuid } );
                    resolve ( true );
                    db.close ();
                }
            } catch ( error ) {
                console.error ( error );
                reject ( error );
            }
        } )
    }
}

module.exports = Calculator;
