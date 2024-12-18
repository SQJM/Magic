"use strict";

const magic = ( () => {
	const node_path = require( "path" );
	const node_fs = require( "fs" );

	const app = {};

	function xmlToJson( xml ) {
		function convertNode( node ) {
			const obj = {};
			node.childNodes.forEach( child => {
				if ( child.nodeType === 1 ) {
					const key = child.tagName.toLowerCase();
					const type = child.getAttribute( 'type' );
					child.removeAttribute( 'type' );

					if ( type === 'xml' ) {
						const xml = new DOMParser().parseFromString( child.outerHTML, "text/xml" );
						obj[ key ] = xml.documentElement;
						return;
					}

					if ( child.childNodes.length === 1 && child.firstChild.nodeType === 3 ) {
						const value = child.firstChild.nodeValue;

						if ( type === 'number' ) {
							obj[ key ] = parseInt( value );
						} else if ( type === 'float' ) {
							obj[ key ] = parseFloat( value );
						} else if ( type === 'boolean' ) {
							obj[ key ] = value === "true";
						} else {
							obj[ key ] = value;
						}
					} else {
						obj[ key ] = convertNode( child );
					}
				}
			} );
			return obj;
		}

		return convertNode( xml );
	}

	function runUiScript( task = () => {}, m ) {
		try {
			task( m );
			document.querySelector( `script[m-id-script="${ m.id }"]` ).remove();
		} catch ( e ) {
			throw new Error( e ).stack;
		}
	}

	function parserM( mid ) {
		const e = document.querySelector( `[m-id="${ mid }"]` );
		e.setAttribute( "magic-type", "m" );

		let mData = null;
		const data = e.getElementsByTagName( "m-data" ).item( 0 );
		if ( data ) {
			mData = xmlToJson( data );
			data.remove();
		}

		const monitor_event = {};
		const call_monitor_event = ( eventName ) => {
			if ( monitor_event[ eventName ] ) monitor_event[ eventName ]();
		}

		const m_interface = {};

		const m = {
			id : mid,
			element : e,
			data : mData,
			name : e.getAttribute( "m-name" )

			event : {
				destruct : () => {
					call_monitor_event( "destruct" );

					e.querySelectorAll( `[magic-type="m"]` ).forEach( me => {
						me._m.event.destruct();
					} );
					e.remove();
				}
			},

			monitor : ( eventName, callback = () => {} ) => {
				monitor_event[ eventName ] = callback;
			},
			getMonitorList : () => {
				return { ...monitor_event };
			},
			removeMonitor : ( eventName ) => {
				if ( monitor_event[ eventName ] === undefined ) return false;
				monitor_event[ eventName ] = null;
				delete monitor_event[ eventName ];
			},

			useInterface : ( name ) => m_interface[ name ],
			setInterface : ( name, callback = () => {} ) => {
				m_interface[ name ] = callback;
			},
			removeInterface : ( name ) => {
				if ( m_interface[ name ] === undefined ) return false;
				m_interface[ name ] = null;
				delete m_interface[ name ];
			}
		};

		e[ "_m" ] = m;
		return m;
	}

	const importM = ( () => {
		function _importM( mPath, data = "" ) {
			const mFilePath = node_path.normalize( `./build/m/${ mPath.replace( /[^a-zA-Z]/g, '' ).toLowerCase() }` );
			const tempElement = document.createElement( "div" );

			try {
				tempElement.innerHTML = node_fs.readFileSync( mFilePath ).toString();
			} catch ( e ) {
				throw `读取 m 文件失败: ${ e } [path:${ mFilePath }]`;
			}

			const s = tempElement.querySelector( "script[m-id-script]" );

			const script = document.createElement( "script" );
			script.setAttribute( "type", "text/javascript" );
			script.setAttribute( "m-id-script", s.getAttribute( "m-id-script" ) );
			script.textContent = s.textContent;

			tempElement.removeChild( s );

			tempElement.firstElementChild.appendChild( script );
			tempElement.firstElementChild.innerHTML += data;

			return import_unfold( tempElement.firstElementChild );
		}

		function import_unfold( element ) {
			const ims = element.querySelectorAll( "m-import" );
			if ( ims.length === 0 ) return element;
			ims.forEach( mi => {
				const name = mi.getAttribute( "name" );
				element.insertBefore( _importM( name, mi.innerHTML ), mi );
				mi.remove();
			} );
			return element;
		}

		return _importM;
	} )();

	return {
		runUiScript,
		importM,
		parserM,
		app,
		init : ( mid ) => {
			const AppMain = document.getElementById( 'app-main' );
			AppMain.appendChild( importM( mid ) );
		}
	}
} )();