import { runTask } from "../util/task.js";
import fs from "fs";
import { printf } from "../global/printf.js";
import { parse } from "node-html-parser"
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
import htmlMinify from "html-minifier";
import { isStringOverSize } from "../util/is-string-over-size.js";
import { MagicConfig } from "../global/magic-config.js";
import { createHTMLElement } from "../util/html-element.js";
import { GetConfigBuildPlatform } from "../util/get-config-build-platform.js";

export const BuildApp = ( magic_config ) => {
	const {
		"build" : build_magic_config,
		"app" : app_magic_config
	} = magic_config;

	build_magic_config[ "main" ] = build_magic_config[ "main" ].replace( /[^a-zA-Z]/g, '' ).toLowerCase();

	const Dom = CreateIndexDom( magic_config );

	runTask( "copy runtime lib", () => {
		const platform_config = GetConfigBuildPlatform( build_magic_config );

		const libPath = build_magic_config[ "build_dir" ] + "/magic";

		fs.copyFileSync( __magic_app.runDir + "/core/runtime/runtime.js", libPath + "/runtime.js" );
		fs.copyFileSync( __magic_app.runDir + "/core/runtime/style.css", libPath + "/style.css" );

		fs.copyFileSync(
			__magic_app.runDir + `/core/runtime/platform/${ platform_config[ "name" ] }.js`,
			`${ __magic_app.project.dir }/${ build_magic_config[ "build-dir" ] }/magic/init.js`
		);
	} );

	let pt = {
		previa_root : {}
	};

	const AllScript = [], AllStyle = [], AllM = [];
	let currentScriptBlock = `window["__M_SCRIPT"] = {};`,
		currentStyleBlock = ``,
		currentMBlock = ``;

	runTask( "build m", () => {
		build_magic_config[ "m-data" ].forEach( obj => {
			const mName = obj.name;
			const element = parse( obj.data );

			const previa_data = BuildMPrevia( element.querySelector( "script[previa]" ), pt );

			let templateConfig = {
				tagName : "div"
			};

			let templateContent = BuildMTemplate( element, templateConfig, build_magic_config );
			templateContent = BuildMImport( element, templateContent );
			const styleContent = BuildMStyle( element, build_magic_config, mName );
			const scriptContent = BuildMScript( element, previa_data, build_magic_config, mName );

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

			let data =
				`<${ templateConfig.tagName } m-id="magic-app-main" m-name="${ mName }">${ templateContent }</${ templateConfig.tagName }>`;

			if ( mName === build_magic_config[ "main" ] ) {
				Dom.app_main.setTextContent( data );
			}

			currentScriptBlock += scriptContent;
			if ( isStringOverSize( currentScriptBlock, MagicConfig[ "[m-script.js]-sharding-size" ] ) ) {
				AllScript.push( currentScriptBlock );
				currentScriptBlock = "";
			}

			currentStyleBlock += styleContent;
			if ( isStringOverSize( currentStyleBlock, MagicConfig[ "[m-style.css]-sharding-size" ] ) ) {
				AllStyle.push( currentStyleBlock );
				currentStyleBlock = "";
			}

			currentMBlock += `magic.MCacheSystem.set("${ mName }",\`${ data }\`);\n`;
			if ( isStringOverSize( currentMBlock, MagicConfig[ "[m.js]-sharding-size" ] ) ) {
				AllM.push( currentMBlock );
				currentMBlock = "";
			}
		} );
	} );

	runTask( "create m.js", () => {
		AllM.push( currentMBlock );
		let i = 0, c = "";
		AllM.forEach( block => {
			Dom.head.appendChild( createHTMLElement( "script", {
				attribute : [
					[ "type", "text/javascript" ],
					[ "src", `./magic/m${ c }.js` ]
				]
			} ) );

			fs.writeFileSync( build_magic_config[ "build_dir" ] + `/magic/m${ c }.js`, block );

			i += 1;
			c = "-" + i;
		} );
	} );

	runTask( "create m-style.css", () => {
		AllStyle.push( currentStyleBlock );
		let i = 0, c = "";
		AllStyle.forEach( block => {
			Dom.head.appendChild( createHTMLElement( "link", {
				singleTag : true,
				attribute : [
					[ "rel", "stylesheet" ],
					[ "type", "text/css" ],
					[ "href", `./magic/m-style${ c }.css` ]
				]
			} ) );

			fs.writeFileSync( build_magic_config[ "build_dir" ] + `/magic/m-style${ c }.css`, block );

			i += 1;
			c = "-" + i;
		} );
	} );

	runTask( "create m-script.js", () => {
		AllScript.push( currentScriptBlock );
		let i = 0, c = "";
		AllScript.forEach( block => {
			if ( build_magic_config[ "min-code" ][ "js" ] ) block = minify_sync( { code : block }, {} ).code;

			Dom.head.appendChild( createHTMLElement( "script", {
				attribute : [
					[ "type", "text/javascript" ],
					[ "src", `./magic/m-script${ c }.js` ]
				]
			} ) );

			fs.writeFileSync( build_magic_config[ "build_dir" ] + `/magic/m-script${ c }.js`, block );

			i += 1;
			c = "-" + i;
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
			return `{${ objString }}`;
		}

		fs.writeFileSync( build_magic_config[ "build_dir" ] + "/magic/previa.js", `window[ "previa" ] = ${ traverseObject( pt.previa_root ) };` );
	} );

	runTask( "min css", () => {
		if ( !build_magic_config[ "file_to_build" ][ ".css" ] || !build_magic_config[ "min-code" ][ "css" ] ) return;
		const files = build_magic_config[ "file_to_build" ][ ".css" ];
		if ( Array.isArray( files ) ) files.forEach( path => {
			const fileContent = fs.readFileSync( path ).toString();
			try {
				const data = compressCSS( fileContent );
				fs.writeFileSync( path, data );
			} catch ( e ) {
				throw outError( e, path )
			}
		} );
	} );

	runTask( "min js", () => {
		if ( !build_magic_config[ "file_to_build" ][ ".js" ] || !build_magic_config[ "min-code" ][ "js" ] ) return;
		const files = build_magic_config[ "file_to_build" ][ ".js" ];
		files.push( build_magic_config[ "build_dir" ] + "/magic/previa.js" );
		if ( Array.isArray( files ) ) files.forEach( path => {
			const fileContent = fs.readFileSync( path ).toString();
			try {
				const data = minify_sync( { code : fileContent }, {} ).code;
				fs.writeFileSync( path, data );
			} catch ( e ) {
				throw outError( e, path )
			}
		} );
	} );

	runTask( "build init-app.js", () => {
		fs.writeFileSync( build_magic_config[ "build_dir" ] + "/init-magic-app.js", `magic.init("${ build_magic_config[ "main" ] }");` );
	} );

	try {
		fs.writeFileSync( build_magic_config[ "build_dir" ] + "/index.html", `<!DOCTYPE html>${ Dom.Get() }` );
	} catch ( e ) {
		printf.error( e )
	}
}