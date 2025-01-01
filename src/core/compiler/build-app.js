import { runTask } from "../util/task.js";
import { createHTMLElement } from "../util/html-element.js";
import fs from "fs";
import { printf } from "../global/printf.js";
import { parse } from "node-html-parser"
import path from "path";
import { outError } from "../util/error.js";
import { __magic_app } from "../../magic-app.js";
import { minify_sync } from "terser";
import htmlMinify from 'html-minifier';
import { compressCSS } from "../util/compress-css.js";

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

		const app_style = createHTMLElement( "div" );
		app_style.setAttribute( "id", "app-style" );

		const meta = createHTMLElement( "meta", { singleTag : true } );
		meta.setAttribute( "charset", "UTF-8" );

		{
			html.appendChild( head );
			html.appendChild( body );

			head.appendChild( meta );
			head.appendChild( title );

			body.appendChild( app_style );
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
			importScript_init_app.setAttribute( "src", "./init-magic-app.js" );

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
					style.setAttribute( "type", "text/css" );
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
			app_main,
			app_style
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

			let templateContent = "", styleContent = "", scriptContent = "";
			let templateConfig = {
				tagName : "div"
			};

			let mid_macro = "$[=+M-ID+=]$";
			if ( fileName === build_magic_config[ "main" ] ) {
				mid_macro = "magic-app-main";
			}

			try {
				const template = element.getElementsByTagName( "template" ).at( 0 );
				{
					template.hasAttribute( "tag" ) && ( templateConfig.tagName = template.getAttribute( "tag" ) );
				}
				element.removeChild( template );

				const style = element.getElementsByTagName( "style" ).at( 0 );
				if ( style ) {
					let result = style.innerHTML;
					if ( build_magic_config[ "min-code" ][ "css" ] ) {
						result = compressCSS( result );
					}
					if ( style.hasAttribute( "global" ) )
						styleContent = `<style m-style-name="${ fileName }">${ result }</style>`;
					else
						styleContent = `<style m-style-name="${ fileName }">*[m-name="${ fileName }"] {${ result } }</style>`;
				}

				const script_start = element.querySelector( "script[start]" );
				if ( script_start ) {
					let result = script_start.innerHTML;
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
							throw `${ e } [src:${ src }]`;
						}
					} );

					if ( build_magic_config[ "min-code" ][ "js" ] ) result = minify_sync( { code : result }, {} ).code;
					scriptContent =
						`<script type="text/javascript" m-script-name="${ fileName }"> magic.runMScript(function (m) { ${ result } magic.runMInitScript(m); }, magic.parserM("${ mid_macro }"));</script>`;
				}

				templateContent = template.innerHTML || "";

				if ( build_magic_config[ "min-code" ][ "html" ] ) {
					templateContent = htmlMinify.minify( templateContent, {
						"collapseWhitespace" : true,
						"conservativeCollapse" : false,
						"preserveLineBreaks" : false,
						"removeComments" : true,
						"removeCDATASections" : true,
						"removeTagWhitespace" : false,
						"removeAttributeQuotes" : true,
						"removeRedundantAttributes" : true,
						"useShortDoctype" : true,
						"keepClosingSlash" : true,
						"minifyJS" : false,
						"minifyCSS" : false,
						"minifyURLs" : true,
						"removeEmptyAttributes" : true,
						"removeScriptTypeAttributes" : false,
						"removeStyleLinkTypeAttributes" : false,
						"sortClassName" : true,
						"sortAttributes" : true,
						"ignoreCustomComments" : [ "^!", "^html-report" ],
						"customAttrCollapse" : false,
						"decodeEntities" : true
					} );
				}
			} catch ( e ) {
				throw outError( e )
			}

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