export function deepMerge( target, source ) {
	Object.keys( source ).forEach( key => {
		if ( target[ key ] && typeof target[ key ] === 'object' && typeof source[ key ] === 'object' ) {
			target[ key ] = deepMerge( Object.assign( {}, target[ key ] ), source[ key ] );
		} else {
			target[ key ] = Object.assign( {}, source[ key ] );
		}
	} );
	return target;
}