import { createHTMLElement } from "../util/html-element.js";

export const CreateIndexDom = ( magic_config ) => {
	const {
		"build" : build_magic_config,
		"app" : app_magic_config
	} = magic_config;

	const html = createHTMLElement( "html" );
	html.setAttribute( "lang", app_magic_config[ "app" ][ "lang" ] || "zh" );

	const head = createHTMLElement( "head" );

	const body = createHTMLElement( "body" );

	const title = createHTMLElement( "title" );
	title.setTextContent( app_magic_config[ "app" ][ "title" ] || "Magic!!!" );

	const app_main = createHTMLElement( "div" );
	app_main.setAttribute( "id", "app-main" );

	const MagicMElementTempDeposit = createHTMLElement( "div" );
	MagicMElementTempDeposit.setAttribute( "id", "magic-m-element-temp-deposit" );

	const app_style = createHTMLElement( "div" );
	app_style.setAttribute( "id", "app-style" );

	const meta = createHTMLElement( "meta", { singleTag : true } );
	meta.setAttribute( "charset", "UTF-8" );

	{
		html.appendChild( head );
		html.appendChild( body );

		head.appendChild( meta );
		head.appendChild( title );

		app_main.appendChild( MagicMElementTempDeposit );

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
		const importScript_previa = createHTMLElement( "script", {
			attribute : [
				[ "type", "text/javascript" ],
				[ "src", "./previa.js" ]
			]
		} );

		const importScript_ui = createHTMLElement( null, { annotation : true } );
		importScript_ui.setTextContent( "$[==#ui#==]$" );

		head.appendChild( importScript_runtime_runtime, importScript_platform, importScript_ui, importScript_previa );

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
};