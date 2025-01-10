import { getObjectString } from "../util/get-object-string.js";
import { deepMerge } from "../util/deep-merge.js";
import { outError } from "../util/error.js";
import { EasyScript } from "../util/easy-script.js";

export const BuildMPrevia = ( previa, pt ) => {
	let previa_data = "";
	if ( previa ) {
		const previa_path = previa.getAttribute( "previa" ) || "global";
		try {
			const {
				exportVar,
				fn
			} = EasyScript.parser( previa.innerHTML );

			const parts = previa_path.split( '.' );
			let root = {};
			parts.reduce( ( acc, part ) => {
				acc[ part ] = part === parts[ parts.length - 1 ] ? null : {};
				return acc[ part ];
			}, root );

			function traverseObject( obj ) {
				for ( let key in obj ) {
					if ( obj[ key ] !== null ) {
						traverseObject( obj[ key ] );
					} else {
						obj[ key ] = getObjectString( fn );
					}
				}
			}

			traverseObject( root );

			pt.previa_root = deepMerge( Object.assign( {}, pt.previa_root ), root );

			previa_data = `const { ${ exportVar.join( "," ) } } = window["previa"].${ previa_path };`;
		} catch ( e ) {
			throw outError( `${ e } [previa:${ previa_path }}]` );
		}

		previa.remove();
	}
	return previa_data;
}