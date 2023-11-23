const { databasePath } = require ( "../constants/AppData" );
const Database = require ( 'better-sqlite3' )

const createQuery = "create table categories_contents ( content_UUID TEXT not null, cat_Id int not null, constraint categories_contents_pk primary key (cat_Id, content_UUID), foreign key (cat_Id) references categories, constraint categories_contents_contents_uuid_fk foreign key (content_UUID) references contents (uuid) );"

class Categories_Contents {

    static all () {
        return new Promise ( ( resolve, reject ) => {
            try {
                const db = new Database ( databasePath, {} );
                const stmt = db.prepare ( 'SELECT * FROM categories_contents' )
                const rows = stmt.all ();
                resolve ( rows );
                db.close ();
            } catch ( error ) {
                console.error ( error );
                reject ( error );
            }
        } )
    }

    static allCategoriesIds () {
        return new Promise ( ( resolve, reject ) => {
            try {
                const db = new Database ( databasePath, {} );
                const stmt = db.prepare ( 'SELECT cat_Id FROM categories_contents' )
                const rows = stmt.all ();
                resolve ( rows );
                db.close ();
            } catch ( error ) {
                console.error ( error );
                reject ( error );
            }
        } )
    }

    static allForProfile ( profile ) {
        return new Promise ( ( resolve, reject ) => {
            try {
                const db = new Database ( databasePath, {} );
                const stmt = db.prepare ( 'SELECT cc.cat_Id, cc.content_UUID FROM categories_contents AS cc INNER JOIN profiles_contents AS pc ON pc.content_UUID = cc.content_UUID WHERE pc.profile_Id = ?' )
                const rows = stmt.all ( profile );
                resolve ( rows );
                db.close ();
            } catch ( error ) {
                console.error ( error );
                reject ( error );
            }
        } )
    }

    static allForOtherProfiles ( profile ) {
        return new Promise ( ( resolve, reject ) => {
            try {
                const db = new Database ( databasePath, {} );
                const stmt = db.prepare ( 'SELECT cc.cat_Id, cc.content_UUID FROM categories_contents AS cc INNER JOIN profiles_contents pc ON cc.content_UUID = pc.content_UUID AND pc.profile_Id <> ?' )
                const rows = stmt.all ( profile );
                resolve ( rows );
                db.close ();
            } catch ( error ) {
                console.error ( error );
                reject ( error );
            }
        } )
    }

    static findByCategoryId ( cat_Id ) {
        return new Promise ( ( resolve, reject ) => {
            if ( !cat_Id ) {
                reject ( 'Please provide an id' );
            } else {
                try {
                    const db = new Database ( databasePath, {} );
                    const stmt = db.prepare ( 'SELECT * FROM categories_contents WHERE cat_Id  = ?' );
                    const rows = stmt.all ( cat_Id );
                    resolve ( rows );
                    db.close ()
                } catch ( error ) {
                    console.error ( error );
                    reject ( error );
                }
            }
        } )
    }

    static findByContentUUID ( content_UUID ) {
        return new Promise ( ( resolve, reject ) => {
            if ( !content_UUID ) {
                reject ( 'Please provide an id' );
            } else {
                try {
                    const db = new Database ( databasePath, {} );
                    const stmt = db.prepare ( 'SELECT * FROM categories_contents WHERE content_UUID  = ?' );
                    const rows = stmt.all ( content_UUID );
                    resolve ( rows );
                    db.close ()
                } catch ( error ) {
                    console.error ( error );
                    reject ( error );
                }
            }
        } )
    }

    static create ( categories ) {
        return new Promise ( ( resolve, reject ) => {
            try{
                const db = new Database ( databasePath, {} );
                const relationshipQuery = 'INSERT OR IGNORE INTO categories_contents (cat_Id, content_UUID) VALUES (?, ?)';
                const stmtRelationship = db.prepare ( relationshipQuery );

                const validationQuery = 'SELECT * FROM categories_contents WHERE cat_Id = ? AND content_UUID = ?';
                const stmtValidation = db.prepare ( validationQuery );

                const insertManyRelationships = db.transaction ( ( list ) => {
                    for ( const item of list ) {
                        for ( const content of item.contents ) {
                            try {
                                const rows = stmtValidation.all ( item.id, content );
                                if ( rows.length === 0 ) {
                                    stmtRelationship.run ( item.id, content );
                                }
                            } catch ( error ) {
                                console.error ( "Error on inserting data into categories_contents ", item.id, content, error );
                            }
                        }
                    }
                } )
                insertManyRelationships.immediate ( categories );
                resolve ( true );
                db.close ();
            }
            catch (error) {
                console.log(error);
                reject(error);
            }
        } )
    }

    static deleteByContentUUID ( content_UUID ) {
        return new Promise ( ( resolve, reject ) => {
            if ( !content_UUID ) {
                reject ( 'Please provide an id' );
            } else {
                try {
                    const db = new Database ( databasePath, {} );
                    const stmt = db.prepare ( 'DELETE FROM categories_contents WHERE content_UUID  = ?' );
                    const info = stmt.run ( content_UUID );
                    const data = {
                        deletedId: info.lastInsertRowid,
                        removed: true
                    }
                    resolve ( data );
                    db.close ()
                } catch ( error ) {
                    console.error ( error );
                    reject ( error );
                }
            }
        } )
    }

    static deleteByCategoryId ( cat_Id ) {
        return new Promise ( ( resolve, reject ) => {
            if ( !cat_Id ) {
                reject ( 'Please provide an id' );
            } else {
                try {
                    const db = new Database ( databasePath, {} );
                    const stmt = db.prepare ( 'DELETE FROM categories_contents WHERE cat_Id  = ?' );
                    const info = stmt.run ( cat_Id );
                    resolve ( info.lastInsertRowid );
                    db.close ()
                } catch ( error ) {
                    console.error ( error );
                    reject ( error );
                }
            }
        } )
    }

    static deleteByContentUUIDAndCatId ( content_UUID, cat_Id ) {
        return new Promise ( ( resolve, reject ) => {
            if ( !content_UUID || !cat_Id ) {
                reject ( 'Please provide a cat_Id or content_UUID ' );
            } else {
                try {
                    const db = new Database ( databasePath, {} );
                    const stmt = db.prepare ( 'DELETE FROM categories_contents WHERE content_UUID  = ? AND cat_Id = ?' );
                    const info = stmt.run ( content_UUID, cat_Id );
                    resolve ( info.lastInsertRowid );
                    db.close ()
                } catch ( error ) {
                    console.error ( error );
                    reject ( error );
                }
            }
        } )
    }
}

module.exports = Categories_Contents;
