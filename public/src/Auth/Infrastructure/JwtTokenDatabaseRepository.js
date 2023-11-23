const DB = require('../../Shared/Infrastructure/DB/DB')


const tableName  = 'user_settings'
async function get(){
        const log = global.log
        const knex = DB.createKnexInstance()
        let result = await knex(tableName)
            .where('key', 'token')
            .first('value')
        log.info('JwtTokenDatabaseRepository::get: token fetch from DB', result)
        return result.value;
        /*dbMethod.doGetAllItemsFromTable ( 'user_settings', '' ).then (
            ( rows ) => {
                const jwtToken = rows.filter ( ( item ) => item.key == 'token' )[0].value
                resolve(jwtToken)
            } )*/
}

async function set(token) {
    const log = global.log
    const knex = DB.createKnexInstance ()
    await knex(tableName)
        .insert({
            key: "token",
            value: token
        })
        .onConflict('key')
        .merge()
    log.info('JwtTokenDatabaseRepository::set: token upsert into DB', token)
}

module.exports = {
    get,
    set
}
