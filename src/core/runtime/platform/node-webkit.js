( () => {
	window.nav = {
		runDir : nw.__dirname,
		Window : nw.Window,
		window : nw.Window.get(),
		...nw.App
	};

	const node_path = require( "path" );
	const node_fs = require( "fs" );

	window.nav.file = class {
		static exists = ( path ) => {
			return node_fs.existsSync( path );
		}
		static read = ( path, options = {} ) => {
			const result = node_fs.readFileSync( path, options );
			if ( options[ "binary" ] ) return result;
			return result.toString();
		}
		static write = ( file, data, options ) => {
			return node_fs.writeFileSync( file, data, options );
		}
		static app = ( file, data, options ) => {
			return node_fs.appendFileSync( file, data, options );
		}
		static stat = ( path ) => {
			return node_fs.statSync( path );
		}
	}

	window.nav.direction = class {
		static exists = ( path ) => {
			return node_fs.existsSync( path );
		}
		static create = ( path, options ) => {
			return node_fs.mkdirSync( path, options );
		}
	}

	window.nav.path = class {
		static normalize = ( path ) => {
			return node_path.normalize( path );
		}
		static basename = ( path ) => {
			return node_path.basename( window.nav.path.normalize( path ) );
		}
		static extname = ( path ) => {
			return node_path.extname( window.nav.path.normalize( path ) );
		}
		static targetName = ( path ) => {
			path = window.nav.path.basename( path ).split( "." );
			path.pop();
			return path.join( "." );
		}
	}

	window.nav.FileSystem = class {
		static GetExplorer( callback = () => { }, {
			accept = "",
			type = "nwdirectory",
			isMultiple = false
		} = {} ) {
			const input = document.createElement( "input" );
			input.setAttribute( type, "" );
			isMultiple && input.setAttribute( "multiple", "" );
			input.setAttribute( "type", "file" );
			input.setAttribute( "style", "display:none" );
			if ( type === "file" && accept !== "" ) {
				input.setAttribute( "accept", accept );
			}
			input.click();
			document.body.appendChild( input );
			input.onchange = () => {
				( typeof callback === "function" ) && callback( input.files );
				input.remove();
			};
			const timeid = setInterval( () => {
				if ( document.hasFocus() ) {
					clearInterval( timeid );
					( typeof callback === "function" ) && callback( null );
					input.remove();
				}
			}, 500 );
		}
	}
} )();