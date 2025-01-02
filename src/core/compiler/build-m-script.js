import fs from "fs";
import path from "path";
import { outError } from "../util/error.js";
import { minify_sync } from "terser";

export const BuildMScript = ( element, previa_data, build_magic_config, fileName, mid_macro ) => {
	let scriptContent;
	const script_start = element.querySelector( "script[start]" );
	if ( script_start ) {
		let result = previa_data + script_start.innerHTML;
		{
			const ia = script_start.hasAttribute( "import-all" );

			const ia1 = script_start.hasAttribute( "import-init" );
			const ia2 = script_start.hasAttribute( "import-event" );
			const ia3 = script_start.hasAttribute( "import-interface" );
			const ia4 = script_start.hasAttribute( "import-end" );

			const script_init = element.querySelector( "script[init]" );
			const script_event = element.querySelector( "script[event]" );
			const script_interface = element.querySelector( "script[interface]" );
			const script_end = element.querySelector( "script[end]" );

			let v1, v2, v3, v4;

			if ( script_init ) {
				v1 = script_init.getAttribute( "init" ) || "//__$INIT$__//";
				if ( ia || ia1 ) result += v1;
				result = result.replace( v1, script_init.innerHTML );
			}
			if ( script_event ) {
				v2 = script_event.getAttribute( "event" ) || "//__$EVENT$__//";
				if ( ia || ia2 ) result += v2;
				result = result.replace( v2, script_event.innerHTML );
			}
			if ( script_interface ) {
				v3 = script_interface.getAttribute( "interface" ) || "//__$INTERFACE$__//";
				if ( ia || ia3 ) result += v3;
				result = result.replace( v3, script_interface.innerHTML );
			}
			if ( script_end ) {
				v4 = script_end.getAttribute( "end" ) || "//__$END$__//";
				if ( ia || ia4 ) result += v4;
				result = result.replace( v4, script_end.innerHTML );
			}
		}

		result = result.replace( /@MInclude\/\/[^;]+;/g, ( match ) => {
			const src = match.replace( /@MInclude\/\//g, '' ).slice( 0, -1 );
			try {
				return fs.readFileSync( path.normalize( src ) ).toString();
			} catch ( e ) {
				throw outError( `${ e } [src:${ src }]` );
			}
		} );

		if ( build_magic_config[ "min-code" ][ "js" ] ) result = minify_sync( { code : result }, {} ).code;
		scriptContent =
			`<script type="text/javascript" m-script-name="${ fileName }"> magic.runMScript(function (m) { ${ result } magic.runMInitScript(m); }, magic.parserM("${ mid_macro }"));</script>`;
	} else {
		scriptContent =
			`<script type="text/javascript" m-script-name="${ fileName }"> magic.runMScript(function (m) { /* no code */ magic.runMInitScript(m); }, magic.parserM("${ mid_macro }"));</script>`;
	}
	return scriptContent;
}