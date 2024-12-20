"use strict";

const magic = ( () => {
	const node_path = require( "path" );
	const node_fs = require( "fs" );

	const app = {};

	class Logging {
		oldCount = 1;
		logPath;
		oldData = [];

		constructor( logPath, callback = () => { }, maxSize = 524288 ) {
			this.logPath = node_path.normalize( logPath );

			let bool = true;
			try {
				if ( node_fs.existsSync( logPath ) ) {
					const stats = node_fs.statSync( this.logPath );
					if ( stats.size > maxSize ) {
						node_fs.writeFileSync( this.logPath, `Magic Application output log\n` );
					} else bool = false;
				}
			} catch ( e ) { }
			bool && node_fs.writeFileSync( this.logPath, `Magic Application output log\n` );

			if ( typeof callback === Function ) callback();
		}

		#getDate() {
			const date = new Date();
			return `${ date.getFullYear() }-${ date.getMonth() + 1 }-${ date.getDate() } ${ date.getHours() }:${ date.getMinutes() }:${ date.getSeconds() }`;
		}

		#head( level ) {
			return `[${ this.#getDate() }] [${ level.toUpperCase() }] > `;
		}

		#body( level, data ) {
			let str = "";

			const toString = ( item ) => {
				try {
					if ( typeof item === 'object' ) str += JSON.stringify( item );
					else str += `${ item }`;
				} catch ( e ) {
					str += `${ item }`;
				}
			}

			if ( Array.isArray( data ) ) {
				data.forEach( item => toString( item ) );
			} else {
				toString( data )
			}
			if ( str.trim() === "" ) return false;
			return this.#head( level ) + str;
		}

		#write( data, _data ) {
			if ( data === false ) return;
			if ( this.oldData === _data ) {
				this.oldCount++;
				return;
			}
			if ( this.oldCount !== 1 ) {
				node_fs.appendFileSync( this.logPath, this.oldCount + '...^\n' );
			}
			this.oldCount = 1;
			this.oldData = _data;
			node_fs.appendFileSync( this.logPath, data + '\n' );
		}

		log( ...args ) {
			console.log( ...args );
			this.#write( this.#body( 'LOG', args ), args );
		}

		error( ...args ) {
			console.error( ...args );
			this.#write( this.#body( 'ERROR', args ), args );
		}

		warning( ...args ) {
			console.warn( ...args );
			this.#write( this.#body( 'WARNING', args ), args );
		}

		info( ...args ) {
			console.info( ...args );
			this.#write( this.#body( 'INFO', args ), args );
		}
	}

	app[ "out" ] = new Logging( "./app.log" );

	function _isElementWithinAnotherM( e, t ) {
		function _p( e ) {
			if ( e.getAttribute( "id" ) === "app-main" ) return false;
			const p = e.parentNode;
			if ( p.getAttribute( "magic-type" ) === "m" || e.getAttribute( "magic-type" ) === "m" ) {
				if ( p === t || e === t ) return true;
				else if ( p !== t || e !== t ) return _p( p );
			} else return _p( p );
		}

		return _p( e );
	}

	function xmlToJson( xml ) {
		function convertNode( node ) {
			const obj = {};
			node.childNodes.forEach( child => {
				if ( child.nodeType === 1 ) {
					const key = child.tagName.toLowerCase();
					const type = child.getAttribute( 'type' );
					child.removeAttribute( 'type' );

					if ( key === "init-script" ) {
						obj[ key ] = child.firstChild.nodeValue;
						return;
					}

					if ( type === 'html' ) {
						const temp = document.createElement( "div" );
						temp.innerHTML = child.outerHTML;
						obj[ key ] = temp.firstElementChild.cloneNode( true );
						return;
					} else if ( type === 'xml' ) {
						obj[ key ] = new DOMParser().parseFromString( child.outerHTML, "text/xml" );
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

	function runMScript( task = () => {}, m ) {
		try {
			task( m );
			m.ui.element.querySelector( `script[m-script-name="${ m.ui.name }"]` ).remove();
		} catch ( e ) {
			throw e;
		}
	}

	function parserM( mid ) {
		const e = document.querySelector( `[m-id="${ mid }"]` );
		e.setAttribute( "magic-type", "m" );
		const mName = e.getAttribute( "m-name" );

		e.querySelectorAll( "[m-macro-args]" ).forEach( ele => {
			const args = ele.getAttribute( "m-macro-args" ).split( " " );
			args.forEach( arg => {
				const macroElement = ele.querySelector( "m-macro" );
				if ( macroElement && !_isElementWithinAnotherM( macroElement, e ) ) return;
				try {
					const value = eval( `window.${ arg }` );
					ele.innerHTML = ele.innerHTML.replace( "<m-macro></m-macro>", value );
				} catch ( e ) { app.out.error( e ) }
			} );
		} );

		let mData = null;
		const data = e.getElementsByTagName( "m-data" ).item( 0 );
		if ( data ) {
			mData = xmlToJson( data );
			data.remove();
		}

		const monitor_event = {};
		const call_monitor_event = ( eventName, ...args ) => {
			if ( monitor_event[ eventName ] ) {
				monitor_event[ eventName ].forEach( fn => { fn( ...args ); } );
			}
		}

		const m_interface = {};

		const event = {
			destruct : () => {
				call_monitor_event( "destruct" );

				e.querySelectorAll( `[magic-type="m"]` ).forEach( me => {
					me.uiEvent.use( "destruct" );
				} );

				const as = document.getElementById( "app-style" );
				const styleElement = as.querySelector( `style[m-style-name=${ mName }]` );
				if ( styleElement ) as.removeChild( styleElement );
				e.remove();
			}
		};

		const ui = {
			id : mid,
			element : e,
			mClass : ( () => {
				const obj = {};
				e.querySelectorAll( "[m-class]" ).forEach( ele => {
					if ( !_isElementWithinAnotherM( ele, e ) ) return;
					const className = ele.getAttribute( "m-class" );
					if ( className.length <= 0 ) return;
					obj[ className ] = ele;
					ele.classList.add( className );
				} );
				return new Proxy( obj, {
					get : function ( prop, n ) {
						if ( !document.contains( obj[ n ] ) ) {
							delete obj[ n ];
							return undefined;
						}
						return obj[ n ];
					}
				} );
			} )(),
			mClassUi : ( () => {
				const obj = {};
				e.querySelectorAll( "[m-class]" ).forEach( ele => {
					if ( !_isElementWithinAnotherM( ele, e ) ) return;
					const className = ele.getAttribute( "m-class" );
					if ( className.length <= 0 || !ele[ "ui" ] ) return;
					obj[ className ] = ele.ui;
					ele.classList.add( className );
				} );
				return new Proxy( obj, {
					get : function ( prop, n ) {
						if ( !document.contains( obj[ n ].element ) ) {
							delete obj[ n ];
							return undefined;
						}
						return obj[ n ];
					}
				} );
			} )(),
			getConfigData : ( meta, callback = o => o ) => callback( Object.assign( meta, mData ) ),
			data : mData,
			name : mName,

			monitor : ( eventName, callback = () => {}, eventId = "monitor" ) => {
				if ( !monitor_event[ eventName ] ) monitor_event[ eventName ] = new Map();
				monitor_event[ eventName ].set( eventId, callback );
			},
			getMonitor : ( eventName, eventId ) => {
				return monitor_event[ eventName ].get( eventId );
			},
			getMonitorList : () => {
				return { ...monitor_event };
			},
			removeMonitor : ( eventName, eventId ) => {
				if ( !monitor_event[ eventName ].has( eventId ) ) return false;
				monitor_event[ eventName ].delete( eventId );
				if ( monitor_event[ eventName ].size === 0 ) delete monitor_event[ eventName ];
				return true;
			},

			use : ( () => {
				return new Proxy( m_interface, {
					set : function () { },
					get : function ( objs, name ) {
						return m_interface[ name ];
					}
				} );
			} )(),
			useInterface : ( () => {
				return new Proxy( m_interface, {
					set : function () { },
					get : function ( objs, name ) {
						return m_interface[ name ];
					}
				} );
			} )(),
			setInterface : ( name, callback = () => {}, trigger = false, ...args ) => {
				m_interface[ name ] = callback;
				trigger && m_interface[ name ]( ...args );
			},
			removeInterface : ( name ) => {
				if ( m_interface[ name ] === undefined ) return false;
				m_interface[ name ] = null;
				delete m_interface[ name ];
				return true;
			}
		};

		e[ "ui" ] = ui;
		e[ "uiEvent" ] = {
			use : ( eventName, ...args ) => {
				return event[ eventName ]( ...args );
			},
			setEvent : ( eventName, callback = () => {} ) => {
				event[ eventName ] = ( ...args ) => {
					call_monitor_event( eventName, ...args );
					callback( ...args );
				};
			}
		};

		return {
			ui : ui,
			uiEvent : e[ "uiEvent" ]
		};
	}

	const importM = ( () => {
		function _import_m( mPath, data = "" ) {
			const tempElement = document.createElement( "div" );

			let mName = mPath.replace( /[^a-zA-Z]/g, '' ).toLowerCase();
			const mFilePath = node_path.normalize( `./build/m/${ mName }` );
			try {
				tempElement.innerHTML = node_fs.readFileSync( mFilePath ).toString();
			} catch ( e ) {
				throw `读取 m 文件失败: ${ e } [path:${ mFilePath }]`;
			}

			tempElement.firstElementChild.innerHTML += data;

			const scriptElement = tempElement.querySelector( "script[m-script-name]" );
			if ( scriptElement ) {
				const script = document.createElement( "script" );
				script.setAttribute( "type", "text/javascript" );
				script.setAttribute( "m-script-name", scriptElement.getAttribute( "m-script-name" ) );
				script.textContent = `${ scriptElement.textContent }`;

				tempElement.firstElementChild.appendChild( script );
				tempElement.firstElementChild.removeChild( scriptElement );
			}

			const styleElement = tempElement.querySelector( `style[m-style-name=${ mName }]` );
			if ( styleElement ) {
				const as = document.getElementById( "app-style" );
				if ( as.querySelector( `style[m-style-name=${ mName }]` ) === null ) {
					as.appendChild( styleElement );
				}
			}

			return _import_unfold( tempElement.firstElementChild );
		}

		function _import_unfold( tempElement ) {
			const ims = tempElement.querySelectorAll( "m-import" );
			if ( ims.length === 0 ) {
				return tempElement;
			}
			ims.forEach( mi => {
				const name = mi.getAttribute( "name" );
				const m = _import_m( name, `<m-data>${ mi.innerHTML }</m-data>` );
				mi.className.split( " " ).forEach( cn => {
					if ( cn.trim().length > 0 ) m.classList.add( cn );
				} );
				if ( mi.hasAttribute( "m-class" ) ) m.setAttribute( "m-class", mi.getAttribute( "m-class" ) );
				mi.parentNode.insertBefore( m, mi );
				mi.remove();
			} );
			return tempElement;
		}

		return _import_m;
	} )();

	return {
		Logging,
		runMScript,
		importM,
		asyncImportM : ( mPath, data = "" ) => {
			return new Promise( ( resolve ) => {
				resolve( importM( mPath, data ) );
			} );
		},
		parserM,
		runMInitScript : ( ui ) => {
			if ( !ui[ "data" ] ) return;
			const script = ui.data[ "init-script" ];
			if ( script ) {
				new Function( "ui", script )( ui );
				delete ui[ "data" ][ "init-script" ];
			}
		},
		app,
		init : () => {
			const AppMain = document.getElementById( 'app-main' );
			window[ "Magic-App-Init-Main" ] && window[ "Magic-App-Init-Main" ]( AppMain );
		}
	}
} )();