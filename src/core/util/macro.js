import { __magic_app } from "../../magic-app.js";

export const Macro = ( () => {
	const macros = [
		{
			key : /\$\[PROJECT_RUN_DIR]/,
			value : __magic_app.project.srcDir
		},
		{
			key : /\$\[PROJECT_DIR]/,
			value : __magic_app.project.dir
		}
	];

	return {
		parser : ( string ) => {
			if ( typeof string !== "string" ) return null;
			let resultString = string;
			macros.forEach( macro => {
				resultString = resultString.replace( macro.key, macro.value );
			} );
			return resultString;
		},
		parserJSON : ( object ) => {
			if ( typeof object !== "object" ) return null;

			function traverse( obj ) {
				for ( let key in obj ) {
					if ( obj.hasOwnProperty( key ) ) {
						if ( typeof obj[ key ] === 'object' && obj[ key ] !== null ) {
							traverse( obj[ key ] );
						} else if ( typeof obj[ key ] === 'string' ) {
							obj[ key ] = Macro.parser( obj[ key ] );
						}
					}
				}
			}

			traverse( object );
			return object;
		}
	}
} )();