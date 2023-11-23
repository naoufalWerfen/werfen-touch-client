const { databasePath } = require ( "../constants/AppData" );
const Database = require ( 'better-sqlite3' )
const createQuery = "create table profiles ( id TEXT, name TEXT not null, primary key (id), unique (id) );"

class Profile {
    static all () {
        return new Promise ( ( resolve, reject ) => {
            try {
                const db = new Database ( databasePath, {} );
                const stmt = db.prepare ( 'SELECT * FROM profiles' )
                const rows = stmt.all ();
                resolve ( rows )
                db.close ();
            }
            catch ( error ) {
                console.error ( error );
                reject ( error );
            }
        } )
    }

    static find ( id ) {
        return new Promise ( ( resolve, reject ) => {
            try {
                const db = new Database ( databasePath, {} );
                const stmt = db.prepare ( 'SELECT * FROM profiles WHERE id = ?' )
                const rows = stmt.all ( id );
                resolve ( rows )
                db.close ();
            }
            catch ( error ) {
                console.error ( error );
                reject ( error );
            }
        } )
    }

    static create ( profiles ) {
        return new Promise ( ( resolve, reject ) => {
            try {
                const db = new Database ( databasePath, {} );
                const profileQuery = 'INSERT OR IGNORE INTO profiles(id, name, hash, last_verification) VALUES (?, ?, ?, ?)';
                const stmtProfile = db.prepare ( profileQuery );
                const date = Date.now ();
                const insertMany = db.transaction ( ( list ) => {
                    for ( const item of list ) {
                        const { id, name } = item;
                        const hash = item.hash ? item.hash : id + "_default_hash";
                        const last_verification = date;
                        const profileValue = [ id, name, hash, last_verification ];
                        stmtProfile.run ( profileValue )
                    }
                } )

                insertMany ( profiles );
                resolve ( true );
                db.close ();
            }
            catch ( error ) {
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
                    const stmt = db.prepare ( 'UPDATE  profiles SET name= ?  WHERE id = ?' )
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

    static updateHash ( profileHashData ) {
        return new Promise ( ( resolve, reject ) => {
            try {
                if ( !profileHashData.id || !profileHashData.hash ) {
                    reject ( 'Please provide an id and a hash' )
                } else {
                    const db = new Database ( databasePath, {} );
                    const stmt = db.prepare ( 'UPDATE  profiles SET hash= ?  WHERE id = ?' )
                    const { hash, id } = profileHashData;
                    const info = stmt.run ( hash, id );

                    resolve ( info.lastInsertRowid );
                    db.close ();
                }
            } catch ( error ) {
                console.error ( error );
                reject ( error );
            }
        } )
    }

    static updateInBulk ( data ) {
        return new Promise ( ( resolve, reject ) => {
            try {
                const db = new Database ( databasePath, {} );
                const updateInBulkQuery = 'UPDATE  profiles SET  name = ?, hash = ?, last_verification = ?  WHERE id = ?'
                const stmt = db.prepare ( updateInBulkQuery )
                const updateManyProfiles = db.transaction ( ( list ) => {
                    for ( const item of list ) {
                        const {
                            name,
                            hash,
                            last_verification,
                            id
                        } = item
                        stmt.run ( name, hash, last_verification, id );
                    }
                } )
                updateManyProfiles.immediate ( data );
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
                    reject ( 'Please provide an id' )
                } else {
                    const db = new Database ( databasePath, {} );
                    const stmt = db.prepare ( 'DELETE FROM profiles WHERE id = ?' )
                    const info = stmt.run ( id );
                    const data = {
                        deletedId: info.lastInsertRowid,
                        removed: true
                    }
                    resolve ( data );
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

module.exports = Profile;
