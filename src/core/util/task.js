export const runTask = ( taskName, fn, errCallback = () => {} ) => {
	try {
		fn();
	} catch ( e ) {
		const errString = `${ taskName } # ${ e }`;
		if ( errCallback( errString ) ) return;
		throw errString;
	}
}