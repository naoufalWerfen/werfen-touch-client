const electron = require ( "electron" );
const normalize = require ( "normalize-path" );
const appDataPath = normalize ( electron.app.getPath ( 'appData' ) + "/werfen-touch-client-prod" );
const databasePath = normalize ( appDataPath + "/databases" );
const pathToMigrations = normalize ( electron.app.getAppPath () + "/build/migrations" );

const knex = require('knex');

function createKnexInstance() {
    return knex({
        client: 'better-sqlite3',
        connection: {
            filename: `${databasePath}/content.sqlite`,
        },
        migrations: {
            directory: pathToMigrations,
        },
    });
}

module.exports = {
    createKnexInstance
};