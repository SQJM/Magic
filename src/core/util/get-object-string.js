export function getObjectString( obj ) {
	let objString = '';
	const keys = Object.keys( obj );
	for ( let i = 0; i < keys.length; i++ ) {
		const key = keys[ i ];
		const value = obj[ key ];
		let pair = `${ key }:`;
		if ( typeof value === 'function' ) {
			pair += value.toString();
		} else if ( typeof value === 'object' && value !== null ) {
			pair += `${ getObjectString( value ) }`;
		} else {
			pair += JSON.stringify( value );
		}
		if ( i < keys.length - 1 ) {
			pair += ',';
		}
		objString += pair;
	}
	return `{${ objString }}`;
}