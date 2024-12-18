import { runTask } from "../util/task.js";
import { createHTMLElement } from "../util/html-element.js";
import fs from "fs";
import { printf } from "../global/printf.js";
import { parse } from "node-html-parser"
import path from "path";
import { outError } from "../util/error.js";
import { __magic_app } from "../../magic-app.mjs";
import { mId_generate } from "../util/m-id.js";

export const BuildApp = ( magic_config ) => {
	const {
		"build" : build_magic_config,
		"app" : app_magic_config
	} = magic_config;

	const Dom = ( () => {
		const html = createHTMLElement( "html" );
		html.setAttribute( "lang", app_magic_config[ "app" ][ "lang" ] || "zh" );

		const head = createHTMLElement( "head" );

		const body = createHTMLElement( "body" );

		const title = createHTMLElement( "title" );
		title.setTextContent( app_magic_config[ "app" ][ "title" ] || "Magic!!!" );

		const app_main = createHTMLElement( "div" );
		app_main.setAttribute( "id", "app-main" );

		const meta = createHTMLElement( "meta", { singleTag : true } );
		meta.setAttribute( "charset", "UTF-8" );

		{
			html.appendChild( head );
			html.appendChild( body );

			head.appendChild( meta );
			head.appendChild( title );

			body.appendChild( app_main );
		}

		{
			const importStyle_runtime_style = createHTMLElement( "link", {
				singleTag : true,
				attribute : [
					[ "rel", "stylesheet" ],
					[ "type", "text/css" ],
					[ "href", "./magic/style.css" ]
				]
			} );

			head.appendChild( importStyle_runtime_style );
		}

		{
			const importScript_runtime_runtime = createHTMLElement( "script", {
				attribute : [
					[ "type", "text/javascript" ],
					[ "src", "./magic/runtime.js" ]
				]
			} );
			const importScript_platform = createHTMLElement( "script", {
				attribute : [
					[ "type", "text/javascript" ],
					[ "src", "./magic/init.js" ]
				]
			} );

			const importScript_ui = createHTMLElement( null, { annotation : true } );
			importScript_ui.setTextContent( "$[==#ui#==]$" );

			head.appendChild( importScript_runtime_runtime, importScript_platform, importScript_ui );

			const importScript_init_app = createHTMLElement( "script" );
			importScript_init_app.setAttribute( "type", "text/javascript" );
			importScript_init_app.setAttribute( "src", "./init-magic-app.mjs" );

			const importScript_ui_init = createHTMLElement( null, { annotation : true } );
			importScript_ui_init.setTextContent( "$[==#ui-init#==]$" );

			body.appendChild( importScript_init_app, importScript_ui_init );
		}

		{
			const import_file = build_magic_config[ "import_file" ];

			import_file[ "style" ].forEach( obj => {
				let style = createHTMLElement( "link", { singleTag : true } );

				if ( obj[ "mode" ] === "inline" ) {
					style = createHTMLElement( "style" );
					style.setTextContent( obj[ "data" ] );
					if ( obj[ "load" ] === "end" ) body.appendChild( style ); else head.appendChild( style );
				} else {
					style.setAttribute( "href", obj[ "src" ] );
					style.setAttribute( "rel", "stylesheet" );
					head.appendChild( style );
				}

				if ( Array.isArray( obj[ "attribute" ] ) )
					obj[ "attribute" ].forEach( item => {
						if ( typeof item === "string" ) {
							style.setAttribute( item, "" );
						} else if ( Array.isArray( item ) ) {
							style.setAttribute( item[ 0 ], item[ 1 ] );
						}
					} );
			} );
			import_file[ "script" ].forEach( obj => {
				const script = createHTMLElement( "script" );

				if ( obj[ "mode" ] === "inline" ) script.setTextContent( obj[ "data" ] ); else script.setAttribute( "src", obj[ "src" ] );

				if ( obj[ "module" ] ) script.setAttribute( "type", "module" );

				if ( obj[ "load" ] === "end" ) body.appendChild( script ); else head.appendChild( script );

				if ( Array.isArray( obj[ "attribute" ] ) )
					obj[ "attribute" ].forEach( item => {
						if ( typeof item === "string" ) {
							script.setAttribute( item, "" );
						} else if ( Array.isArray( item ) ) {
							script.setAttribute( item[ 0 ], item[ 1 ] );
						}
					} );
			} );
		}

		return {
			html,
			head,
			body,
			title,
			app_main
		}
	} )();

	runTask( "copy runtime lib", () => {
		const libPath = build_magic_config[ "build_dir" ] + "/magic";

		fs.copyFileSync( __magic_app.runDir + "/core/runtime/runtime.js", libPath + "/runtime.js" );
		fs.copyFileSync( __magic_app.runDir + "/core/runtime/style.css", libPath + "/style.css" );
	} );

	runTask( "build m", () => {
		const m_files = build_magic_config[ "file_to_build" ][ ".m" ];
		if ( Array.isArray( m_files ) ) m_files.forEach( m => {
			const fileContent = fs.readFileSync( m ).toString();
			const fileName = path.basename( m );
			const element = parse( fileContent );

			const mID = mId_generate();

			let templateContent = "", styleContent = "", scriptContent = "";

			try {
				const template = element.getElementsByTagName( "template" )[ 0 ];
				element.removeChild( template );
				const style = element.getElementsByTagName( "style" )[ 0 ];
				const script = element.getElementsByTagName( "script" )[ 0 ];

				if ( style.hasAttribute( "global" ) )
					styleContent = `<style>${ style.innerHTML }</style>`;
				else
					styleContent = `<style>*[m-name="${ fileName }"] {${ style.innerHTML }}</style>`;

				scriptContent = `<script type="text/javascript" m-id-script="${ mID }"> magic.runUiScript((m) => { ${ script.innerHTML } }, magic.parserM("${ mID }"));</script>`;

				templateContent = template.innerHTML;
			} catch ( e ) {
				throw outError( e )
			}

			try {
				const data = `<div m-id="${ mID }" m-name="${ fileName }">${ templateContent }${ styleContent }</div>${ scriptContent }`;
				fs.writeFileSync( m, data );
			} catch ( e ) {
				throw outError( e )
			}
		} );
	} );

	runTask( "build init-app.js", () => {
		const data =
			`(()=>{ magic.init("${ build_magic_config[ "main" ] }") })();`;
		fs.writeFileSync( build_magic_config[ "build_dir" ] + "/init-magic-app.mjs", data );
	} );

	const AppDocElementString = `<!DOCTYPE html>${ Dom.html.toString() }`;

	try {
		fs.writeFileSync( build_magic_config[ "build_dir" ] + "/index.html", AppDocElementString );
	} catch ( e ) {
		printf.error( e )
	}
}