function parser( string ) {
	const classString = `class c{ constructor(){} ${ string } };`;

	const c = eval( `( () => {
		${ classString }
		return c;
	} )();` );
	const n = new c();
	const exportVar = Object.getOwnPropertyNames( n );

	const o = {};
	exportVar.forEach( k => { o[ k ] = n[ k ]; } );
	return {
		exportVar : exportVar,
		fn : o
	}
}

export const EasyScript = {
	parser : parser
}