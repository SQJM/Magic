import { _$ } from "./suggest-symbol.js";

export const JsonTypeDetermination = ( template, target, callback = () => {} ) => {
	try {
		function getAllKeys( obj, tobj, rk ) {
			for ( let key in obj ) {
				if ( obj.hasOwnProperty( key ) && tobj.hasOwnProperty( key ) ) {
					if ( typeof obj[ key ] === 'object' && obj[ key ] !== null ) {
						if ( typeof tobj[ key ] !== 'object' ) {
							throw `${ rk } -> ${ key } ${ _$( "# [!@] *" ) } object ${ _$( "[^@] #" ) } ${ typeof tobj[ key ] }`;
						}
						getAllKeys( obj[ key ], tobj[ key ], key );
					} else {
						const {
							unlink,
							ex,
							rt,
							e
						} = obj[ key ]( tobj[ key ] );
						if ( unlink )
							throw `${ rk } -> ${ key } ${ _$( "# [!@] *" ) } ${ ex } ${ _$( "[^@] #" ) } ${ rt }. ${ e }`;
					}
				}
			}
		}

		getAllKeys( template, target, "[root]" );
	} catch ( e ) {
		callback( false, e );
	}
	callback( true );
};