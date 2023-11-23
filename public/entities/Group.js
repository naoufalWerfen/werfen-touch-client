const { databasePath } = require ( "../constants/AppData" );
const Database = require ( 'better-sqlite3' );

const createQuery = "create table groups ( id TEXT, name TEXT not null, sorting_name TEXT not null, image BLOB, date_created DATE not null, published BOOL not null, deleted BOOL not null, sorting_number INTEGER, primary key (id), unique (id), unique (name), unique (sorting_name) );"

class Group {
    static all () {
        return new Promise ( ( resolve, reject ) => {
            try {
                const db = new Database ( databasePath, {} );
                const stmt = db.prepare ( 'SELECT * FROM groups' )
                const rows = stmt.all ();
                resolve ( rows );
                db.close ();
            } catch ( error ) {
                console.error ( error );
                reject ( error );
            }
        } )
    }

    static allIds () {
        return new Promise ( ( resolve, reject ) => {
            try {
                const db = new Database ( databasePath, {} );
                const stmt = db.prepare ( 'SELECT id FROM groups' )
                const rows = stmt.all ();
                resolve ( rows );
                db.close ();
            } catch ( error ) {
                console.error ( error );
                reject ( error );
            }
        } )
    }

    static findAllGroupsForProfile ( profile ) {
        return new Promise ( ( resolve, reject ) => {
            try {
                if ( !profile ) {
                    reject ( 'Please provide user profile' );
                } else {
                    const db = new Database ( databasePath, {} );
                    const stmt = db.prepare ( 'SELECT DISTINCT grps.id, grps.name FROM groups AS grps INNER JOIN categories as cat INNER JOIN categories_contents AS cc INNER JOIN profiles_contents AS pc INNER JOIN download_manager AS dm WHERE grps.id=cat.gid AND cat.id=cc.cat_Id AND cc.content_UUID=pc.content_UUID AND dm.group_id= cat.gid AND dm.profile_id= ?AND pc.profile_Id=? ORDER BY grps.id ASC' )
                    const rows = stmt.all ( profile, profile );
                    resolve ( rows )
                    db.close ();
                }
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
                    reject ( 'Please provide grroup id' );
                } else {
                    const db = new Database ( databasePath, {} );
                    const stmt = db.prepare ( 'SELECT * FROM groups WHERE id = ?' )
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

    static findMaxPosition () {
        return new Promise ( ( resolve, reject ) => {
            try {
                const db = new Database ( databasePath, {} );
                const stmt = db.prepare ( 'SELECT MAX(sorting_number), id FROM groups  ' )
                const rows = stmt.all ();
                resolve ( rows );
                db.close ();
            } catch ( error ) {
                console.error ( error );
                reject ( error );
            }
        } )
    }

    static findBySortingNumber ( group ) {
        const { sorting_number } = group;
        return new Promise ( ( resolve, reject ) => {
            try {
                if ( !sorting_number ) {
                    reject ( 'Please provide group sorting_number' );
                } else {
                    const db = new Database ( databasePath, {} );
                    const stmt = db.prepare ( 'SELECT * FROM groups WHERE sorting_number = ?' )
                    const rows = stmt.all ( sorting_number );
                    resolve ( rows );
                    db.close ();
                }
            } catch ( error ) {
                console.error ( error );
                reject ( error );
            }
        } )
    }

    static create ( groups ) {
        return new Promise ( ( resolve, reject ) => {
            try {
                const db = new Database ( databasePath, {} );
                const groupQuery = 'INSERT OR IGNORE INTO groups (id, name, sorting_name, image, date_created, published, deleted, sorting_number, hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
                const stmtGroup = db.prepare ( groupQuery );

                const insertManyGroups = db.transaction ( ( list ) => {
                    for ( const item of list ) {
                        const {
                            id,
                            name,
                            sorting_name,
                            image,
                            date_created,
                            published,
                            deleted,
                            sorting_number,
                            hash
                        } = item;
                        stmtGroup.run ( id, name, sorting_name, image, date_created, published ? 1 : 0, deleted ? 1 : 0, sorting_number, hash );
                    }
                } )

                insertManyGroups.immediate ( groups )
                resolve ( true );
                db.close ();
            } catch ( error ) {
                console.error ( error );
                reject ( error );
            }
        } )
    }

    static updateSortingNumber ( group ) {
        return new Promise ( ( resolve, reject ) => {
            try {
                if ( !group.id ) {
                    reject ( 'Please provide an id for a Group' );
                } else {
                    const {
                        sorting_number,
                        id
                    } = group;
                    const db = new Database ( databasePath, {} );
                    const stmt = db.prepare ( 'UPDATE groups SET sorting_number = ?  WHERE id = ?' );
                    const info = stmt.run (
                        sorting_number,
                        id );
                    resolve ( info.lastInsertRowid );
                    db.close ();
                }
            } catch ( error ) {
                console.error ( error );
                reject ( error );
            }
        } )
    }

    static update ( group ) {
        return new Promise ( ( resolve, reject ) => {
            try {
                if ( !group.id ) {
                    reject ( 'Please provide an id for a Group' );
                } else {
                    const {
                        name,
                        sorting_name,
                        image,
                        date_created,
                        published,
                        deleted,
                        sorting_number,
                        hash,
                        id
                    } = group;
                    const db = new Database ( databasePath, {} );
                    const stmt = db.prepare ( 'UPDATE groups SET name= ?, sorting_name= ?, image = ?, date_created = ?, published = ?, deleted =  ?, sorting_number = ?, hash = ?  WHERE id = ?' );
                    const info = stmt.run (
                        name,
                        sorting_name,
                        image,
                        date_created,
                        published ? 1 : 0,
                        deleted ? 1 : 0,
                        sorting_number,
                        hash,
                        id );
                    resolve ( info.lastInsertRowid );
                    db.close ();
                }
            } catch ( error ) {
                console.error ( error );
                reject ( error );
            }
        } )
    }

    static updateInBulk ( groupsToUpdate ) {
        return new Promise ( ( resolve, reject ) => {
            try {
                const db = new Database ( databasePath, {} );
                const groupBulkUpdateQuery = 'UPDATE  groups SET ' +
                    'name= ?, ' +
                    'sorting_name= ?, ' +
                    'image = ?, ' +
                    'date_created = ?,' +
                    'published = ?, ' +
                    'deleted =  ?, ' +
                    'sorting_number = ?, ' +
                    'hash = ? '
                'WHERE id = ?'
                const stmtUpdateGroup = db.prepare ( groupBulkUpdateQuery );
                const updateMany = db.transaction ( ( groups ) => {
                    for ( const group of groups ) {
                        const {
                            name,
                            sorting_name,
                            image,
                            date_created,
                            published,
                            deleted,
                            sorting_number,
                            hash,
                            id
                        } = data;
                        stmtUpdateGroup.run ( name,
                            sorting_name,
                            image,
                            date_created,
                            published,
                            deleted,
                            sorting_number,
                            hash,
                            id )
                    }
                } )
                updateMany.immediate ( groupsToUpdate );
                resolve ( true );
                db.close ();
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
                    reject ( 'Please provide an id' );
                } else {
                    const db = new Database ( databasePath, {} );
                    const stmt = db.prepare ( 'DELETE FROM groups WHERE id = ?' );
                    const info = stmt.run ( id );
                    resolve ( info.lastInsertRowid );
                    db.close ();
                }
            }
            catch ( error ) {
                console.error ( error );
                reject ( error );
            }
        } )
    }
}

module.exports = Group;
