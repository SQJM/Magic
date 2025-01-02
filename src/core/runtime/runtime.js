"use strict";

const magic_version = "1.0.0";
const magic = ( () => {
	const Navigator = {
		path : class {
			static normalize = () => {}
		},

		file : class {
			static exists = () => {}
			static read = () => {}
			static write = () => {}
			static app = () => {}
			static stat = () => {}
		},
		direction : class {
			static exists = () => {}
			static create = () => {}
		}
	}

	const app = {
		AppStyle : {
			get element() {
				return document.getElementById( "app-style" );
			},
			has : ( name ) => {
				return ( app.AppStyle.element.querySelector( `style[m-style-name="${ name }"]` ) !== null );
			},
			add : ( ele ) => {
				app.AppStyle.element.appendChild( ele );
			},
			remove : ( mName ) => {
				if ( app.AppMain.getM( mName ).length <= 0 ) {
					const s = app.AppStyle.element.querySelector( `style[m-style-name="${ mName }"]` );
					if ( app.AppStyle.element.contains( s ) ) app.AppStyle.element.removeChild( s );
				}
			}
		},
		AppMain : {
			getM : ( mName ) => {
				return app.AppMain.element.querySelectorAll( `div[m-name="${ mName }"][magic-type="m"]` );
			},
			get element() {
				return document.getElementById( "app-main" );
			},
			get MagicMElementTempDeposit() {
				return document.getElementById( "magic-m-element-temp-deposit" );
			}
		}
	};

	class Logging {
		oldCount = 1;
		logPath;
		oldData = [];

		constructor( logPath, callback = () => { }, maxSize = 524288 ) {
			this.logPath = Navigator.path.normalize( logPath );

			let bool = true;
			try {
				if ( Navigator.file.exists( logPath ) ) {
					const stats = Navigator.file.stat( this.logPath );
					if ( stats.size > maxSize ) {
						Navigator.file.write( this.logPath, `Magic Application output log\n` );
					} else bool = false;
				}
			} catch ( e ) { }
			bool && Navigator.file.write( this.logPath, `Magic Application output log\n` );

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
				Navigator.file.app( this.logPath, this.oldCount + '...^\n' );
			}
			this.oldCount = 1;
			this.oldData = _data;
			Navigator.file.app( this.logPath, data + '\n' );
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

	function _isElementWithinAnotherM( e, t ) {
		function _p( e ) {
			const p = e.parentNode;
			if (
				e.getAttribute( "id" ) === "app-main"
				||
				!t.contains( e )
				||
				( p.getAttribute( "magic-type" ) === "m" && p !== t )
			) return false;
			if ( p.m && p.getAttribute( "magic-type" ) === "m" || e.m && e.getAttribute( "magic-type" ) === "m" ) {
				if ( p === t || e === t ) return true;
				else if ( p !== t || e !== t ) return _p( p );
			} else return _p( p );
		}

		return _p( e );
	}

	function xmlToJson( xml ) {
		function convertToCamelCase( str ) {
			return str.replace( /-([a-z])/g, ( match, p1 ) => p1.toUpperCase() );
		}

		function convertNode( node ) {
			const obj = {};
			node.childNodes.forEach( child => {
				if ( child.nodeType === 1 ) {
					const key = convertToCamelCase( child.tagName.toLowerCase() );
					child.removeAttribute( 'type' );

					if ( key === "initScript" ) {
						obj[ "init-script" ] = child.firstChild.nodeValue;
						return;
					}

					if ( child.hasAttribute( "html" ) ) {
						const fragment = document.createDocumentFragment();
						fragment.append( ...child.childNodes );
						obj[ key ] = fragment;
						return;
					} else if ( child.hasAttribute( "xml" ) ) {
						obj[ key ] = new DOMParser().parseFromString( child.outerHTML, "text/xml" );
						return;
					}

					if ( child.childNodes.length === 1 && child.firstChild.nodeType === 3 ) {
						const value = child.firstChild.nodeValue;

						if ( child.hasAttribute( "number" ) ) {
							obj[ key ] = parseInt( value );
						} else if ( child.hasAttribute( "float" ) ) {
							obj[ key ] = parseFloat( value );
						} else if ( child.hasAttribute( "boolean" ) ) {
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

	function runMScript( task = function () {}, m ) {
		try {
			m._this_scope = function () { };
			m._this_scope.m = m;
			task.bind( m._this_scope )( m );
			const script = m.element.querySelector( `script[m-script-name="${ m.name }"]` );
			script && script.remove();
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

		let mData = {};
		if ( e[ "_m_data" ] ) {
			mData = e[ "_m_data" ];
			delete e[ "_m_data" ];
		} else {
			const data = e.getElementsByTagName( "m-data" ).item( 0 );
			if ( data ) {
				mData = xmlToJson( data );
				data.remove();
			}
		}

		const monitor_event = {};
		const call_monitor_event = ( eventName, ui_event ) => {
			if ( monitor_event[ eventName ] ) {
				monitor_event[ eventName ].forEach( fn => {
					if ( ui_event.getPropagationState() ) fn( ui_event );
				} );
			}
			return ui_event;
		}

		const m_interface = {};

		const event = {
			destruct : () => {
				call_monitor_event( "destruct" );
				e.remove();
			}
		};

		const m_class = {};
		const fn_refresh_m_class = () => {
			e.querySelectorAll( "[m-class]" ).forEach( ele => {
				if ( !_isElementWithinAnotherM( ele, e ) ) return;
				const className = ele.getAttribute( "m-class" );
				if ( className.length <= 0 ) return;
				m_class[ className ] = {
					element : ele,
					m : ele.m
				};
				ele.parentMNode = e;
				ele.classList.add( className );
			} );
		};
		fn_refresh_m_class();
		const get_m_class = ( name ) => {
			if ( !m_class.hasOwnProperty( name ) ) fn_refresh_m_class();
			if ( !m_class[ name ] || !document.contains( m_class[ name ].element ) ) {
				delete m_class[ name ];
				return {};
			}
			return m_class[ name ];
		}

		const m = {
			id : mid,
			element : e,
			mClass : new Proxy( {}, {
				get : function ( v, n ) {
					return get_m_class( n ).element;
				}
			} ),
			mClassM : new Proxy( {}, {
				get : function ( v, n ) {
					return get_m_class( n ).m;
				}
			} ),
			getConfigData : ( meta, callback = o => o ) => {
				const r = callback( Object.assign( meta, mData ) );
				m.getConfigData = r;
				return r;
			},
			name : mName,

			monitor : {
				add : ( eventName, callback = () => {}, eventId = "monitor" ) => {
					if ( !monitor_event[ eventName ] ) monitor_event[ eventName ] = new Map();
					monitor_event[ eventName ].set( eventId, callback );
				},
				get : ( eventName, eventId ) => {
					return monitor_event[ eventName ].get( eventId );
				},
				getList : () => {
					return { ...monitor_event };
				},
				remove : ( eventName, eventId ) => {
					if ( !monitor_event[ eventName ].has( eventId ) ) return false;
					monitor_event[ eventName ].delete( eventId );
					if ( monitor_event[ eventName ].size === 0 ) delete monitor_event[ eventName ];
					return true;
				}
			},

			interface : {
				use : ( () => {
					return new Proxy( m_interface, {
						set : function () { },
						get : function ( objs, name ) {
							return m_interface[ name ];
						}
					} );
				} )(),
				set : ( name, callback = () => {}, trigger = false, ...args ) => {
					m_interface[ name ] = callback;
					trigger && m_interface[ name ]( ...args );
				},
				remove : ( name ) => {
					if ( m_interface[ name ] === undefined ) return false;
					m_interface[ name ] = null;
					delete m_interface[ name ];
					return true;
				},
				export : ( u, list ) => {
					if ( Array.isArray( list ) ) {
						list = list.reduce( ( obj, k ) => {
							obj[ k ] = () => {};
							return obj;
						}, {} );
					}
					for ( const key in list ) {
						const value = list[ key ];
						u.interface.set( key, ( ...args ) => {
							value( ...args );
							m.interface.use[ key ]( ...args );
						} );
					}
				}
			},

			event : {
				use : ( eventName, ui_event ) => {
					return event[ eventName ]( ui_event );
				},
				set : ( eventName, callback = ui_event => ui_event ) => {
					event[ eventName ] = ( ui_event ) => {
						return call_monitor_event( eventName, callback( ui_event ) );
					};
				}
			}
		};

		if ( mData && mData[ "init-script" ] ) m[ "init-script" ] = mData[ "init-script" ];

		e[ "m" ] = m;
		return m;
	}

	const existsM = ( mPath ) => {
		let mName = mPath.replace( /[^a-zA-Z0-9]/g, '' ).toLowerCase();
		const mFilePath = Navigator.path.normalize( `./build/m/${ mName }` );
		return Navigator.file.exists( mFilePath );
	}

	const importM = ( () => {
		const MAdminSystem = new Map();
		const _10_minute = 10 * 60 * 1000;
		setInterval( () => {
			MAdminSystem.forEach( ( obj, mName ) => {
				const timestamp = new Date().getTime();
				if ( ( timestamp - obj.timestamp ) > _10_minute ) MAdminSystem.delete( mName );
			} );
		}, _10_minute );

		function mId_generate() {
			const uuidPart = Array.from( { length : 12 }, () =>
				crypto.getRandomValues( new Uint8Array( 1 ) )[ 0 ].toString( 16 ).slice( -1 )
			).join( '' );

			const time = new Date().getTime().toString();
			const timePart = time.substring( 4 );

			return `${ uuidPart }-${ timePart }`;
		}

		function replaceMID( str, id ) {
			const lastIndex = str.lastIndexOf( "$[=+M-ID+=]$" );
			if ( lastIndex !== -1 ) {
				return str.slice( 0, lastIndex ) + id + str.slice( lastIndex + 12 );
			}
			return str;
		}

		function _import_m( mPath = "null", data = "" ) {
			let tempElement = document.createElement( "div" );
			let mName = mPath.replace( /[^a-zA-Z]/g, '' ).toLowerCase();
			if ( MAdminSystem.has( mName ) ) {
				const obj = MAdminSystem.get( mName );
				tempElement.innerHTML = obj.m;
				obj.timestamp = new Date().getTime();
				MAdminSystem.set( mName, obj );
			} else {
				const mFilePath = Navigator.path.normalize( `./build/m/${ mName }` );
				if ( !Navigator.file.exists( mFilePath ) ) throw `m 文件不存在: ${ mFilePath }`;
				try {
					const string = Navigator.file.read( mFilePath );
					tempElement.innerHTML = string;
					MAdminSystem.set( mName, {
						m : string,
						timestamp : new Date().getTime()
					} );
				} catch ( e ) {
					throw `读取 m 文件失败: ${ e } [path:${ mFilePath }]`;
				}
			}

			const mid = mId_generate();

			const MElement = tempElement.firstElementChild;
			if ( typeof data === "object" ) {
				MElement[ "_m_data" ] = data;
			} else
				MElement.innerHTML += data;

			MElement.setAttribute( "m-id", mid );

			const scriptElement = tempElement.querySelector( `script[m-script-name="${ mName }"]` );
			if ( scriptElement ) {
				const script = document.createElement( "script" );
				script.setAttribute( "type", "text/javascript" );
				script.setAttribute( "m-script-name", scriptElement.getAttribute( "m-script-name" ) );
				script.textContent = replaceMID( scriptElement.textContent, mid );

				MElement.appendChild( script );
				MElement.removeChild( scriptElement );
			}

			const styleElement = tempElement.querySelector( `style[m-style-name="${ mName }"]` );
			if ( styleElement ) {
				if ( app.AppStyle.has( mName ) ) {
					styleElement.remove();
				} else
					app.AppStyle.add( styleElement );
			}

			return _import_unfold( MElement );
		}

		function _import_unfold( MElement ) {
			const ims = MElement.querySelectorAll( "m-import" );
			if ( ims.length === 0 ) {
				return MElement;
			}
			ims.forEach( mi => {
				const src = mi.getAttribute( "src" ) || "null";
				const m = _import_m( src, `<m-data>${ mi.innerHTML }</m-data>` );
				mi.className.split( " " ).forEach( cn => {
					if ( cn.trim().length > 0 ) m.classList.add( cn );
				} );
				mi.getAttributeNames().forEach( attr => {
					if ( attr === "src" ) return;
					if ( mi.getAttribute( attr ) ) m.setAttribute( attr, mi.getAttribute( attr ) );
				} );
				mi.parentNode.insertBefore( m, mi );
				mi.remove();
			} );
			return MElement;
		}

		return _import_m;
	} )();

	{

		const originalRemove = Element.prototype.remove;
		Element.prototype.remove = function () {
			this.querySelectorAll( `[magic-type="m"]` ).forEach( me => {
				me.m.event.use( "destruct" );
			} );

			if ( this[ "m" ] ) {
				const m = this.m;
				const mName = m.name;
				app.AppStyle.remove( mName );
				m._this_scope = undefined;
				delete m._this_scope;
			}

			originalRemove.call( this );
		};
	}

	return {
		createUIEvent : ( o, m ) => {
			{
				const propagationStateSymbol = Symbol( 'PropagationState' );
				Object.defineProperty( o, propagationStateSymbol, {
					value : true,
					writable : true,
					enumerable : false,
					configurable : true
				} );

				o.stopPropagation = () => {
					o[ propagationStateSymbol ] = false;
				};

				o.getPropagationState = () => {
					return o[ propagationStateSymbol ];
				};
			}

			return o;
		},
		Logging,
		runMScript,
		existsM,
		importM : ( mPath, data = "" ) => {
			const m = importM( mPath, data );
			magic.app.AppMain.MagicMElementTempDeposit.appendChild( m );
			m[ "init" ] = ( f ) => { f( m ); };
			return m;
		},
		asyncImportM : ( mPath, data = "" ) => new Promise( ( resolve ) => { resolve( importM( mPath, data ) ); } ),
		parserM,
		runMInitScript : ( m ) => {
			if ( m[ "init-script" ] ) {
				const script = m[ "init-script" ];
				if ( script ) {
					new Function( "m", script )( m );
				}
				delete m[ "init-script" ];
			}
		},
		app,
		Navigator,
		init : () => {
			app[ "out" ] = new magic.Logging( "./app.log" );
			window[ "Magic-App-Init-Main" ] && window[ "Magic-App-Init-Main" ]( app.AppMain );
		}
	}
} )();