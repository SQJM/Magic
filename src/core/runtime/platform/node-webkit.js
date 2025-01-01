( () => {
	magic.app = Object.assign( magic.app, {
		runDir : nw.__dirname,
		Window : nw.Window,
		window : nw.Window.get(),
		...nw.App
	} );

	const node_path = require( "path" );
	const node_fs = require( "fs" );

	magic.Navigator.file = class extends magic.Navigator.file {
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

	magic.Navigator.path = class extends magic.Navigator.path {
		static normalize = ( path ) => {
			return node_path.normalize( path );
		}
	}
} )();