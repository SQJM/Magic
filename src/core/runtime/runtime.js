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
		const mName = e.getAttribute( "m-name" );

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
			mClass : ( () => {
				const obj = {};
				e.querySelectorAll( "[m-class]" ).forEach( ele => {
					const className = ele.getAttribute( "m-class" );
					obj[ className ] = ele;
					ele.classList.add( className );
				} );
				return obj;
			} )(),
			data : mData,
			name : mName,

			event : {
				destruct : () => {
					call_monitor_event( "destruct" );

					e.querySelectorAll( `[magic-type="m"]` ).forEach( me => {
						me._m.event.destruct();
					} );

					const as = document.getElementById( "app-style" );
					const styleElement = as.querySelector( `style[m-style-name=${ mName }]` );
					if ( styleElement ) as.removeChild( styleElement );
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
			setInterface : ( name, callback = () => {}, trigger = false, ...args ) => {
				m_interface[ name ] = callback;
				trigger && m_interface[ name ]( ...args );
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

	const import_m = ( () => {
		function _importM( mPath, data = "" ) {
			const mName = mPath.replace( /[^a-zA-Z]/g, '' ).toLowerCase();
			const mFilePath = node_path.normalize( `./build/m/${ mName }` );
			const tempElement = document.createElement( "div" );

			try {
				tempElement.innerHTML = node_fs.readFileSync( mFilePath ).toString();
			} catch ( e ) {
				throw `读取 m 文件失败: ${ e } [path:${ mFilePath }]`;
			}

			const element = tempElement.firstElementChild;

			element.innerHTML += data;

			const scriptElement = tempElement.querySelector( "script[m-id-script]" );
			if ( scriptElement ) {
				const script = document.createElement( "script" );
				script.setAttribute( "type", "text/javascript" );
				script.setAttribute( "m-id-script", scriptElement.getAttribute( "m-id-script" ) );
				script.textContent = scriptElement.textContent;

				element.appendChild( script );

				tempElement.removeChild( scriptElement );
			}

			const styleElement = element.querySelector( `style[m-style-name=${ mName }]` );
			if ( styleElement ) {
				const as = document.getElementById( "app-style" );
				if ( as.querySelector( `style[m-style-name=${ mName }]` ) === null ) {
					as.appendChild( styleElement );
				}
			}

			return import_unfold( element );
		}

		function import_unfold( element ) {
			const ims = element.querySelectorAll( "m-import" );
			if ( ims.length === 0 ) return element;
			ims.forEach( mi => {
				const name = mi.getAttribute( "name" );
				element.insertBefore( _importM( name, `<m-data>${ mi.innerHTML }</m-data>` ), mi );
				mi.remove();
			} );
			return element;
		}

		return _importM;
	} )();

	return {
		runUiScript,
		importM : import_m,
		parserM,
		app,
		init : ( mid ) => {
			const AppMain = document.getElementById( 'app-main' );
			AppMain.appendChild( import_m( mid ) );
		}
	}
} )();