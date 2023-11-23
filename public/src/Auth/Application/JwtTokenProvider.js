const JwtTokenDatabaseRepository = require ( '../Infrastructure/JwtTokenDatabaseRepository' )

async function getToken () {
    const log = global.log
    let token = await JwtTokenDatabaseRepository.get ();
    if ( !token ) {
        log.error ('JwtTokenProvider::geToken: Token not found')
        throw new Error ( 'Token not found' );
    }
    log.info ('JwtTokenProvider::geToken: Token found',token)
    return token;
}


async function setToken(token){
    const log = global.log
    try {
      await JwtTokenDatabaseRepository.set(token)
      log.info('JwtTokenProvider::setToken: Token set',token )
    }catch ( error ){
      log.error('JwtTokenProvider::setToken: Error setting token',token )
    }
}


module.exports = {
    getToken,
    setToken
}