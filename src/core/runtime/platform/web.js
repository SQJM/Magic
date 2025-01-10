( () => {
	window.nav = {};

	window.nav.FileSystem = class {
		static GetExplorer( callback = () => { }, {
			accept = "",
			type = "directory",
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