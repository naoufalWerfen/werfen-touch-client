const { databasePath } = require ( "../constants/AppData" );
const Database = require ( 'better-sqlite3' )


const createQuery = "create table profiles_contents ( profile_Id TEXT, content_UUID TEXT, primary key (profile_Id, content_UUID), foreign key (profile_Id) references profiles, foreign key (content_UUID) references contents (uuid) );"

class Profiles_Calculators {

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
            } catch ( error ) {
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
            } catch ( error ) {
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

module.exports = Profiles_Calculators;
