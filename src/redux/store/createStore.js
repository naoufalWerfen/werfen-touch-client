import { applyMiddleware, createStore as _createStore } from 'redux';
import rootReducer from '../reducers/index';
import promiseMiddleware from './middleware/promiseMiddleware';
import loggerMiddleware from './middleware/loggerMiddleware';

export default function createStore( initialState ) {
    const middleware = [ promiseMiddleware, loggerMiddleware ];

    let finalCreateStore;
    //TODO Review dotenv
    if ( process.env.NODE_ENV === 'development' ) {
        const { compose } = require( 'redux' );
        const { persistState } = require( 'redux-devtools' );
        const DevTools = require( "../../containers/DevTools/DevTools" ).default;

        finalCreateStore = compose(
            applyMiddleware( ...middleware ),
            window.__REDUX_DEVTOOLS_EXTENSION__ ? window.__REDUX_DEVTOOLS_EXTENSION__() : DevTools.instrument(),
            persistState( window.location.href.match( /[?&]debug_session=([^&]+)\b/ ) )
        )( _createStore );
    } else {
        finalCreateStore = applyMiddleware( ...middleware )( _createStore );
    }

    const store = finalCreateStore( rootReducer, initialState );

    // Make Reducers hot loadable
    if ( process.env.NODE_ENV === 'development' && module.hot ) {
        module.hot.accept( "../reducers/index", () => {
            store.replaceReducer( require( "../reducers/index" ).default );
        } );
    }

    return store;
}
