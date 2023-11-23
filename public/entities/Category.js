const { databasePath } = require ( "../constants/AppData" );
const Database = require ( 'better-sqlite3' )


const createQuery = "create table categories ( id TEXT, name TEXT not null, sorting_name TEXT not null, image BLOB not null, date_created DATE not null, published BOOL not null, gid TEXT, sorting_number INTEGER, primary key (id), unique (id), foreign key (gid) references groups );"

class Category {
    static all () {
        return new Promise ( ( resolve, reject ) => {
            try {
                const db = new Database ( databasePath, {} );
                const stmt = db.prepare ( 'SELECT * FROM categories' )
                const rows = stmt.all ();
                resolve ( rows );
                db.close ();
            } catch ( error ) {
                reject ( error )
            }
        } )
    }

    static allIds () {
        return new Promise ( ( resolve, reject ) => {
            try {
                const db = new Database ( databasePath, {} );
                const stmt = db.prepare ( 'SELECT id FROM categories' )
                const rows = stmt.all ();
                resolve ( rows );
                db.close ();
            } catch ( error ) {
                reject ( error )
            }
        } )
    }

    static allGids () {
        return new Promise ( ( resolve, reject ) => {
            try {
                const db = new Database ( databasePath, {} );
                const stmt = db.prepare ( 'SELECT gid FROM categories' )
                const rows = stmt.all ();
                resolve ( rows );
                db.close ();
            } catch ( error ) {
                reject ( error )
            }
        } )
    }

    static allInGroup ( group ) {
        return new Promise ( ( resolve, reject ) => {
            if ( !group ) {
                reject ( 'Please provide an id' );
            } else {
                try {
                    const db = new Database ( databasePath, {} );
                    const stmt = db.prepare ( 'SELECT * FROM categories WHERE gid= ? ' )
                    const rows = stmt.all ( group );
                    resolve ( rows );
                    db.close ();
                } catch ( error ) {
                    console.error ( error );
                    reject ( error );
                }
            }
        } )
    }

    static find ( id ) {
        return new Promise ( ( resolve, reject ) => {
            if ( !id ) {
                reject ( 'Please provide an id' );
            } else {
                try {
                    const db = new Database ( databasePath, {} );
                    const stmt = db.prepare ( 'SELECT * FROM categories WHERE id = ?' )
                    const rows = stmt.all ( id );
                    resolve ( rows );
                    db.close ();
                } catch ( error ) {
                    console.error ( error );
                    reject ( error );
                }
            }
        } )
    }

    static findMaxPosition () {
        return new Promise ( ( resolve, reject ) => {
            try {
                const db = new Database ( databasePath, {} );
                const stmt = db.prepare ( 'SELECT MAX(sorting_number), id FROM categories  ' )
                const rows = stmt.all ();
                resolve ( rows );
                db.close ();
            } catch ( error ) {
                console.error ( error );
                reject ( error );
            }
        } )
    }

    static findBySortingNumber ( category ) {
        const { sorting_number } = category;
        return new Promise ( ( resolve, reject ) => {
            try {
                if ( !sorting_number ) {
                    reject ( 'Please provide category sorting_number' );
                } else {
                    const db = new Database ( databasePath, {} );
                    const stmt = db.prepare ( 'SELECT * FROM categories WHERE sorting_number = ?' )
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

    static allFirstCategories ( profile ) {
        //add promise and the query for getFirstCategories from DBMethods
    }

    static create ( categories ) {
        return new Promise ( ( resolve, reject ) => {
            try {
                const db = new Database ( databasePath, {} );
                const categoryQuery = 'INSERT OR IGNORE INTO categories(id, name, sorting_name, image, date_created, published, gid, sorting_number, hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
                const stmtCategory = db.prepare ( categoryQuery );

                const insertManyCategories = db.transaction ( ( list ) => {
                    for ( const item of list ) {
                        const {
                            id,
                            name,
                            sorting_name,
                            image,
                            date_created,
                            published,
                            gid,
                            sorting_number,
                            hash
                        } = item;
                        stmtCategory.run ( id, name, sorting_name, image, date_created, published ? 1 : 0, gid, sorting_number, hash );
                    }
                } )

                insertManyCategories.immediate ( categories );
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
                    const stmt = db.prepare ( 'DELETE FROM categories WHERE id = ?' );
                    const info = stmt.run ( id );
                    resolve ( info.lastInsertRowid );
                    db.close ()
                }
            } catch ( error ) {
                console.error ( error );
                reject ( error );
            }
        } )
    }

    static update ( category ) {
        return new Promise ( ( resolve, reject ) => {
            try {
                if ( !category.id ) {
                    reject ( 'Please provide an id for a Category' );
                } else {
                    const {
                        name,
                        sorting_name,
                        image,
                        date_created,
                        published,
                        gid,
                        sorting_number,
                        hash,
                        id
                    } = category;
                    const db = new Database ( databasePath, {} );
                    const stmt = db.prepare ( 'UPDATE categories SET name= ?, sorting_name= ?, image = ?, date_created = ?, published = ?, gid =  ?, sorting_number = ?, hash = ?  WHERE id = ?' );
                    const info = stmt.run (
                        name,
                        sorting_name,
                        image,
                        date_created,
                        published ? 1 : 0,
                        gid,
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

    static updateSortingNumber ( category ) {
        return new Promise ( ( resolve, reject ) => {
            try {
                if ( !category.id ) {
                    reject ( 'Please provide an id for a category' );
                } else {
                    const {
                        sorting_number,
                        id
                    } = category;
                    const db = new Database ( databasePath, {} );
                    const stmt = db.prepare ( 'UPDATE categories SET sorting_number = ?  WHERE id = ?' );
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
}

module.exports = Category;
