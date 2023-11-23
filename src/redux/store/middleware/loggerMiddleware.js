/* eslint-disable no-console */
export default function loggerMiddleware( store ) {
    return next => action => {

        const result = next( action );

        return result;
    };
}
/* eslint-enable no-console */
