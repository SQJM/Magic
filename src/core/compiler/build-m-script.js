import fs from "fs";
import path from "path";
import { outError } from "../util/error.js";
import { EasyScript } from "../util/easy-script.js";

function re_string( scope, name, fn, once ) {
	return `${ scope }.interface.set( "${ name }",${ fn }, ${ once } );`
}

function parser_script_interface( nodeList, fileName ) {
	let exp = "", code = "", other = "";

	Array.isArray( nodeList ) && nodeList.forEach( node => {
		const pt = node.getAttribute( "interface" ) || "this";
		const text = node.innerHTML;
		const once = node.hasAttribute( "once" );

		const exportTarget = node.getAttribute( "export" );

		try {
			const {
				exportVar,
				fn
			} = EasyScript.parser( text );

			if ( exportTarget ) {
				const r = ( () => {
					const arr = exportTarget.split( "." );
					let str = "m";
					if ( arr.length === 1 ) return `m.mClassM["${ exportTarget }"]`;
					arr.forEach( v => {
						str += `.mClassM["${ v }"]`;
					} );
					return str;
				} )();

				if ( fn[ exportVar ] ) {
					exportVar.forEach( v => {
						exp += `${ re_string( "m", v, `(...args)=>{ ((${ fn[ exportVar ] })()) !== false && ${ r }.interface.use[ "${ v }" ](...args); }`, once ) }\n`;
					} );
				} else {
					exportVar.forEach( v => {
						exp += `${ re_string( "m", v, `${ r }.interface.use[ "${ v }" ]`, once ) }\n`;
					} );
				}
			} else {
				if ( pt === "this" ) {
					exportVar.forEach( v => {
						code += `${ re_string( "m", v, fn[ v ], once ) }\n`;
					} );
				} else {
					exportVar.forEach( v => {
						other += `${ re_string( `m.mClassM[ "${ pt }" ]`, v, fn[ v ], once ) }\n`;
					} );
				}
			}
		} catch ( e ) {
			throw outError( `${ e } [interface:${ fileName }}]` );
		}
	} );

	return {
		macro : nodeList[ 0 ].getAttribute( "interface" ),
		code : exp + other + code
	}
}

export const BuildMScript = ( element, previa_data, build_magic_config, fileName ) => {
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
			const script_interface = element.querySelectorAll( "script[interface]" );
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
			if ( script_interface && script_interface.length > 0 ) {
				const {
					code,
					macro
				} = parser_script_interface( script_interface, fileName );
				v3 = macro || "//__$INTERFACE$__//";
				if ( ia || ia3 ) result += v3;
				result = result.replace( v3, code );
			}
			if ( script_end ) {
				v4 = script_end.getAttribute( "end" ) || "//__$END$__//";
				if ( ia || ia4 ) result += v4;
				result = result.replace( v4, script_end.innerHTML );
			}
		}

		result = result.replace( /@MInclude`([^`]+)`/g, ( match ) => {
			const src = match.replace( /@MInclude`|`/g, '' );
			try {
				return fs.readFileSync( path.normalize( src ) ).toString();
			} catch ( e ) {
				throw outError( `${ e } [src:${ src }]` );
			}
		} );

		scriptContent =
			`window["__M_SCRIPT"]["${ fileName }"] = function (m) { ${ result } magic.runMInitScript(m) };\n`;
	} else {
		scriptContent =
			`window["__M_SCRIPT"]["${ fileName }"] = function (m) { magic.runMInitScript(m) };\n`;
	}
	return scriptContent;
}