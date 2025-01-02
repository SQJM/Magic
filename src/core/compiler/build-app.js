import { runTask } from "../util/task.js";
import fs from "fs";
import { printf } from "../global/printf.js";
import { parse } from "node-html-parser"
import path from "path";
import { outError } from "../util/error.js";
import { __magic_app } from "../../magic-app.js";
import { minify_sync } from "terser";
import { compressCSS } from "../util/compress-css.js";
import { CreateIndexDom } from "./create-index-dom.js";
import { BuildMPrevia } from "./build-m-previa.js";
import { BuildMStyle } from "./build-m-style.js";
import { BuildMTemplate } from "./build-m-template.js";
import { BuildMScript } from "./build-m-script.js";
import { BuildMImport } from "./build-m-import.js";

export const BuildApp = ( magic_config ) => {
	const {
		"build" : build_magic_config,
		"app" : app_magic_config
	} = magic_config;

	const Dom = CreateIndexDom( magic_config );

	runTask( "copy runtime lib", () => {
		const libPath = build_magic_config[ "build_dir" ] + "/magic";

		fs.copyFileSync( __magic_app.runDir + "/core/runtime/runtime.js", libPath + "/runtime.js" );
		fs.copyFileSync( __magic_app.runDir + "/core/runtime/style.css", libPath + "/style.css" );
	} );

	let pt = {
		previa_root : {}
	};

	runTask( "build m", () => {
		const m_files = build_magic_config[ "file_to_build" ][ ".m" ];
		if ( Array.isArray( m_files ) ) m_files.forEach( m => {
			const fileContent = fs.readFileSync( m ).toString();
			const fileName = path.basename( m );
			const element = parse( fileContent );

			let templateContent, styleContent, scriptContent;
			let templateConfig = {
				tagName : "div"
			};

			let mid_macro = "$[=+M-ID+=]$";
			if ( fileName === build_magic_config[ "main" ] ) {
				mid_macro = "magic-app-main";
			}

			const previa_data = BuildMPrevia( element.querySelector( "script[previa]" ), pt );

			templateContent = BuildMTemplate( element, templateConfig, build_magic_config );
			templateContent = BuildMImport( element, templateContent );
			styleContent = BuildMStyle( element, build_magic_config, fileName );
			scriptContent = BuildMScript( element, previa_data, build_magic_config, fileName, mid_macro );

			try {
				let data;
				if ( fileName === build_magic_config[ "main" ] ) {
					data = `<${ templateConfig.tagName } m-id="magic-app-main" m-name="${ fileName }">${ templateContent }${ scriptContent }</${ templateConfig.tagName }>`;
					Dom.app_main.setTextContent( data );
					Dom.app_style.setTextContent( styleContent );
				} else {
					data = `<${ templateConfig.tagName } m-id="magic-app-main" m-name="${ fileName }">${ templateContent }${ styleContent }${ scriptContent }</${ templateConfig.tagName }>`;
				}
				fs.writeFileSync( m, data );
			} catch ( e ) {
				throw outError( e )
			}
		} );
	} );

	runTask( "create previa", () => {
		function traverseObject( obj ) {
			let objString = '';
			const keys = Object.keys( obj );
			for ( let i = 0; i < keys.length; i++ ) {
				const key = keys[ i ];
				const value = obj[ key ];
				if ( typeof value === 'object' && value !== null ) {
					objString += `${ key }: ${ traverseObject( value ) }`;
				} else {
					objString += `${ key }: ${ value }`;
				}
				if ( i < keys.length - 1 ) {
					objString += ', ';
				}
			}
			if ( objString ) return `{${ objString }}`;
			return objString;
		}

		fs.writeFileSync( build_magic_config[ "build_dir" ] + "/previa.js", `window[ "previa" ] = ${ traverseObject( pt.previa_root ) };` );
	} );

	runTask( "min css", () => {
		const files = build_magic_config[ "file_to_build" ][ ".css" ];
		if ( Array.isArray( files ) ) files.forEach( path => {
			const fileContent = fs.readFileSync( path ).toString();
			try {
				let data = fileContent;
				if ( build_magic_config[ "min-code" ][ "css" ] ) {
					data = compressCSS( fileContent );
				}
				fs.writeFileSync( path, data );
			} catch ( e ) {
				throw outError( e, path )
			}
		} );
	} );

	runTask( "min js", () => {
		const files = build_magic_config[ "file_to_build" ][ ".js" ];
		files.push( build_magic_config[ "build_dir" ] + "/previa.js" );
		if ( Array.isArray( files ) ) files.forEach( path => {
			const fileContent = fs.readFileSync( path ).toString();
			try {
				let data = fileContent;
				if ( build_magic_config[ "min-code" ][ "js" ] ) {
					data = minify_sync( { code : fileContent }, {} ).code;
				}
				fs.writeFileSync( path, data );
			} catch ( e ) {
				throw outError( e, path )
			}
		} );
	} );

	runTask( "build init-app.js", () => {
		const data = `magic.init();`;
		fs.writeFileSync( build_magic_config[ "build_dir" ] + "/init-magic-app.js", data );
	} );

	const AppDocElementString = `<!DOCTYPE html>${ Dom.html.toString() }`;

	try {
		fs.writeFileSync( build_magic_config[ "build_dir" ] + "/index.html", AppDocElementString );
	} catch ( e ) {
		printf.error( e )
	}
}