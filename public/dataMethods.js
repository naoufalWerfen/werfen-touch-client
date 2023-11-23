const dbMethod = require ( './DBmethods' );
const log = require ( "electron-log" );

const methods = {
    doMapCategories: mapCategories,
    doMapGroups: mapGroups,
    doMapProfiles: mapProfilesFromJson
}

function mapCatContents ( category ) {

    let output,
        outputTorReturn;
    return new Promise ( ( resolve, reject ) => {
        try {
            let mappedCatContents = category.contents.map ( ( content_UUID ) => {
                const relationObject = {
                    cat_Id: category.id,
                    content_UUID: content_UUID
                }
                dbMethod.insertIntoDatabase ( "categories_contents", relationObject )
                    .then ( () => {
                        console.info ( "Success! Category: " + category.id + " and Content: " + content_UUID );
                        return true;
                    } )
                    .catch ( ( error ) => {
                        console.log ( "Error inserting data into categories_contents table ", error, category.id, content_UUID );
                        let failedEntry = {
                            cat_id: category.id,
                            content_UUID
                        }
                        dbMethod.insertIntoDatabase ( "categories_contents", failedEntry )
                            .then ( () => {
                                outputTorReturn = category;
                                resolve ( outputTorReturn );
                            } )
                    } );
            } )
            Promise.all ( ( mappedCatContents ) )
                .then ( ( output ) => {
                    if ( output ) {
                        delete category.contents;
                        outputTorReturn = category;
                        resolve ( outputTorReturn );
                    } else {
                        console.info ( { failedEntry: output } )

                    }
                } )
                .catch ( ( error ) => {
                    console.info ( "Error on mapping category contents for DB", error, category.id, content_UUID );
                } )
        } catch ( error ) {
            reject ( error )
        }
    } )
    output = outputTorReturn
    return output;
}

function mapCategories ( categories ) {
    return new Promise ( ( resolve, reject ) => {

        try {
            categories.map ( ( category ) => {
                if ( category.hasOwnProperty ( 'groupId' ) ) {
                    let gid = category.groupId;
                    category.gid = gid;
                    delete category.groupId;
                }

                mapCatContents ( category )
                    .then ( ( category ) => {
                        if ( category.hasOwnProperty ( "sorting_number" ) === false ) {
                            category.sorting_number = category.position;
                            delete category.position;
                        }
                        dbMethod.insertIntoDatabase ( "categories", category )
                            .then ( () => {
                                console.info ( category.id + " inserted!" );
                            } )
                            .catch ( ( error ) => {
                                console.log ( "Error inserting " + category.id + " data into categories table." );
                                //log.error ( 'Error inserting data into categories table: ', error );
                            } )
                    } )
                resolve ( true );
            } )
                .catch ( ( error ) => {
                    console.info ( "Error on mapping cat contents", error )
                } )

        } catch ( error ) {
            reject ( error );
        }
    } )

}

function mapGroups ( groups ) {
    return new Promise ( ( resolve, reject ) => {
        try {
            let mappedGroups = groups.map ( ( group, index ) => {
                //TODO: ADD sorting number to evaluate groups order in menu:
                //INSERT INTO Log (id, rev_no, description) VALUES ((SELECT IFNULL(MAX(id), 0) + 1 FROM Log), 'rev_Id', 'some description')
                if ( group.hasOwnProperty ( "sorting_number" ) === false ) {
                    group.sorting_number = group.position;
                    delete group.position;
                }
                dbMethod.insertIntoDatabase ( "groups", group )
                    .then ( () => {
                        console.log ( group.name + " has been inserted into groups table " )
                    } )
                    .catch ( ( error ) => {
                        console.log ( "Error on inserting groups into groups table ", error, group.name )
                        //log.error ( 'Error on inserting groups into DB table, 1st installation ', error )
                    } );

            } );
            Promise.all ( ( mappedGroups ) )
                .then ( () => resolve () )
                .catch ( ( error ) => {
                    console.info ( "Error on mapping groups for DB", error )
                } )
        } catch ( error ) {
            reject ( error );
        }
    } )
}

function mapProfilesContents ( profile ) {
    let output,
        outputToReturn;
    return new Promise ( ( resolve, reject ) => {
        try {
            let mappedProfilesContent = profile.contents.map ( content_UUID => {
                const relationObject = {
                    profile_id: profile.id,
                    content_UUID: content_UUID
                }
                dbMethod.insertIntoDatabase ( "profiles_contents", relationObject )
                    .then ( () => {
                        console.info ( "Successfully attached: " + profile.id + " " + content_UUID )
                    } )
                    .catch ( ( error ) => {
                        console.info ( error );
                    } );

            } )
            Promise.all ( mappedProfilesContent )
                .then ( () => {
                    delete profile.contents;
                    outputToReturn = profile;
                    resolve ( outputToReturn );
                } )
                .catch ( ( error ) => {
                    console.info ( "Error on mapping profiles contents", error )
                } )
        } catch ( error ) {
            reject ( error )
        }
    } )
    output = outputToReturn;
    return output;
}

function mapProfilesFromJson ( profiles ) {
    return new Promise ( ( resolve, reject ) => {
        try {
            profiles.map ( profile => {
                if ( profile.contents.length > 0 ) {
                    mapProfilesContents ( profile )
                        .then ( ( profile ) => {
                            const profileObject = {
                                id: profile.id,
                                name: profile.name
                            }
                            dbMethod.insertIntoDatabase ( "profiles", profileObject )
                                .then ( () => {
                                    console.log ( "Profile " + profile.id + " inserted into DB" )
                                    resolve ( true );
                                } )
                                .catch ( ( error ) => {
                                    console.log ( "Error on inserting profiles has been inserted into profiles table ", error )
                                } );
                        } )
                        .catch ( ( error ) => {
                            console.info ( error )
                        } )
                }
            } )
        } catch ( error ) {
            reject ( error )
        }
    } )
}

module.exports = methods;