const { databasePath } = require ( "../constants/AppData" );
const Database = require ( 'better-sqlite3' )


const createQuery = "create table profiles_contents ( profile_Id TEXT, content_UUID TEXT, primary key (profile_Id, content_UUID), foreign key (profile_Id) references profiles, foreign key (content_UUID) references contents (uuid) );"

class Profiles_Contents {

    static all () {
        return new Promise ( ( resolve, reject ) => {
            try {
                const db = new Database ( databasePath, {} );
                const stmt = db.prepare ( 'SELECT * FROM profiles_contents' )
                const rows = stmt.all ();
                resolve ( rows );
                db.close ();
            } catch ( error ) {
                console.error ( error );
                reject ( error );
            }
        } )
    }

    static findByProfileId ( profile_Id ) {
        return new Promise ( ( resolve, reject ) => {
            try {
                const db = new Database ( databasePath, {} );
                const stmt = db.prepare ( 'SELECT * FROM profiles_contents WHERE profile_Id  = ?' )
                const rows = stmt.all ( profile_Id );
                resolve ( rows )
                db.close ();
            } catch ( error ) {
                console.error ( error );
                reject ( error );

            }
        } )
    }

    static findByContentUUID ( content_UUID ) {
        return new Promise ( ( resolve, reject ) => {
            try {
                const db = new Database ( databasePath, {} );
                const stmt = db.prepare ( 'SELECT * FROM profiles_contents WHERE content_UUID = ?' )
                const rows = stmt.all ( content_UUID );
                resolve ( rows )
                db.close ();
            } catch ( error ) {
                console.error ( error );
                reject ( error );

            }
        } )
    }

    static findByContentUUIDForOtherProfiles ( content_UUID, profile ) {
        return new Promise ( ( resolve, reject ) => {
            try {
                const db = new Database ( databasePath, {} );
                const stmt = db.prepare ( 'SELECT pc.content_UUID, cc.cat_Id FROM profiles_contents AS pc INNER JOIN categories_contents AS cc on pc.content_UUID = cc.content_UUID WHERE pc.content_UUID = ? AND pc.profile_Id <> ? ' )
                const rows = stmt.all ( content_UUID, profile );
                resolve ( rows )
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
                const { clonedContents, userProfile } = data;
                const contentsWithoutImages = clonedContents.filter ( item => item.classification !== "image" );
                const relationshipQuery = "INSERT OR IGNORE INTO profiles_contents(profile_Id, content_UUID) VALUES (?, ?) ";
                const stmtRelationship = db.prepare ( relationshipQuery );

                const insertManyRelationships = db.transaction ( ( list ) => {
                    for ( const item of list ) {
                        stmtRelationship.run ( userProfile, item.uuid );
                    }
                } );

                insertManyRelationships.immediate ( contentsWithoutImages );
                resolve ( true );
                db.close ();
            }
            catch ( error ) {
                console.error ( error );
                reject ( error );

            }
        } )
    }

    static deleteByContentUUID ( content_UUID ) {
        return new Promise ( ( resolve, reject ) => {
            try {
                if ( !content_UUID ) {
                    reject ( 'Please provide an id' );
                } else {
                    const db = new Database ( databasePath, {} );
                    const stmt = db.prepare ( 'DELETE FROM profiles_contents WHERE content_UUID  = ?' )
                    const info = stmt.run ( content_UUID );

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

    static deleteByProfileId ( profile_Id ) {
        return new Promise ( ( resolve, reject ) => {
            try {
                if ( !profile_Id ) {
                    reject ( 'Please provide an id' );
                } else {
                    const db = new Database ( databasePath, {} );
                    const stmt = db.prepare ( 'DELETE FROM profiles_contents WHERE profile_Id = ?' )
                    const info = stmt.run ( profile_Id );
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

    static deleteByProfileIdAndContentUUID ( profile_Id, contentUUIDsForDeleting ) {
        return new Promise ( ( resolve, reject ) => {
            try {
                if ( !profile_Id || contentUUIDsForDeleting.length === 0 ) {
                    reject ( 'Please provide an id and a list of contents to delete' );
                } else {
                    const db = new Database ( databasePath, {} );
                    const contentProfileDeleteQuery = 'DELETE FROM profiles_contents WHERE profile_Id = ? AND content_UUID = ?'
                    const stmtDeleteEntry = db.prepare ( contentProfileDeleteQuery )
                    const deleteManyContents = db.transaction ( ( contentUUIDsForDeleting ) => {
                        for ( const contentUUID of contentUUIDsForDeleting ) {
                            stmtDeleteEntry.run ( profile_Id, contentUUID );
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
}

module.exports = Profiles_Contents;
