"use strict";

const magic_version = "1.0.0";
const magic = ( () => {
	const MCacheSystem = ( () => {
		const map = new Map();

		return {
			all : () => map.keys(),
			has : ( mName ) => {
				return map.has( mName.replace( /[^a-zA-Z]/g, '' ).toLowerCase() );
			},
			set : ( mName, string ) => {
				map.set( mName.replace( /[^a-zA-Z]/g, '' ).toLowerCase(), string );
			},
			get : ( mName ) => {
				return map.get( mName.replace( /[^a-zA-Z]/g, '' ).toLowerCase() );
			}
		}
	} )();

	let _import_m_z_index = 0;

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
				} catch ( e ) {
					console.error( e );
				}
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
					fn( ui_event );
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
			initConfigData : ( meta, callback = o => o ) => {
				m.getConfigData = callback( Object.assign( meta, mData ) );
				return m.getConfigData;
			},
			getConfigData : mData,
			getAllConfigData : () => {
				const arr = [];
				const root = m.getConfigData;
				m.element.querySelectorAll( `[magic-type="m"]` ).forEach( ele => {
					const obj = ele.m.getConfigData;
					for ( const key in obj ) {
						if ( key.at( 0 ) === "_" ) delete obj[ key ];
					}
					arr.push( obj );
				} );
				return {
					root : root,
					childData : arr
				}
			},
			name : mName,
			originalPath : e[ "m-original-path" ],

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

		{
			delete e[ "m-original-path" ];
		}

		if ( mData && mData[ "init-script" ] ) {
			m[ "init-script" ] = mData[ "init-script" ];
			delete mData[ "init-script" ];
		}

		e[ "m" ] = m;

		fn_refresh_m_class();

		return m;
	}

	function runMInitScript( m ) {
		if ( m[ "init-script" ] ) {
			const script = m[ "init-script" ];
			if ( script ) {
				new Function( "m", script )( m );
			}
			delete m[ "init-script" ];
		}
	}

	const importM = ( () => {
		function mId_generate() {
			return Array.from( { length : 16 }, () =>
				crypto.getRandomValues( new Uint8Array( 1 ) )[ 0 ].toString( 16 ).slice( -1 )
			).join( '' );
		}

		function _import_m( mPath = "null", data = "", mIds = [] ) {
			let tempElement = document.createElement( "div" );
			let mName = mPath.replace( /[^a-zA-Z]/g, '' ).toLowerCase();
			if ( MCacheSystem.has( mName ) ) {
				tempElement.innerHTML = MCacheSystem.get( mName );
			} else {
				throw `m 不存在: ${ mPath }`;
			}

			const mid = mId_generate();

			const MElement = tempElement.firstElementChild;
			if ( data && typeof data === "object" )
				MElement[ "_m_data" ] = data;
			else if ( typeof data === "string" )
				MElement.innerHTML += data;

			MElement.setAttribute( "m-id", mid );
			MElement[ "m-original-path" ] = mPath;

			mIds.push( {
				mName : mName,
				mid : mid,
				index : _import_m_z_index
			} );

			if ( MElement.querySelectorAll( "m-import" ).length === 0 ) {
				if ( _import_m_z_index !== 0 ) _import_m_z_index--;
				return MElement;
			}
			return _import_unfold( MElement, mIds );
		}

		function _import_unfold( MElement, mIds ) {
			_import_m_z_index++;
			while ( true ) {
				const im = MElement.querySelector( "m-import" );
				if ( !im ) break;
				const src = im.getAttribute( "src" ) || "null";
				const m = _import_m( src, `<m-data>${ im.innerHTML }</m-data>`, mIds );
				im.className.split( " " ).forEach( cn => {
					if ( cn.trim().length > 0 ) m.classList.add( cn );
				} );
				im.getAttributeNames().forEach( attr => {
					if ( attr === "src" ) return;
					if ( im.getAttribute( attr ) ) m.setAttribute( attr, im.getAttribute( attr ) );
				} );
				im.parentNode.insertBefore( m, im );
				im.remove();
			}
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

			originalRemove.call( this );
		};
	}

	return {
		MCacheSystem,
		importM : ( mPath, data = "" ) => {
			const mIds = [];
			_import_m_z_index = 0;
			const e = importM( mPath, data, mIds );

			magic.AppMain.MagicMElementTempDeposit.appendChild( e );
			{
				const obj = {};
				mIds.forEach( o => {
					if ( !obj[ o.index ] ) obj[ o.index ] = [];
					obj[ o.index ].push( o );
				} );

				Object.keys( obj ).reverse().forEach( i => {
					obj[ i ].reverse().forEach( o => {
						window[ "__M_SCRIPT" ][ o.mName ]( parserM( o.mid ) );
					} );
				} );
			}

			return {
				init : ( f ) => {
					f( e.m );
					return e.m;
				},
				...e.m
			};
		},
		asyncImportM : ( mPath, data = "" ) => new Promise( ( resolve ) => { resolve( magic.importM( mPath, data ) ); } ),
		parserM,
		runMInitScript,
		AppMain : {
			get element() {
				return document.getElementById( "app-main" );
			},
			get MagicMElementTempDeposit() {
				return document.getElementById( "magic-m-element-temp-deposit" );
			}
		},
		init : ( main ) => {
			console.log( "%cMagic ヾ(๑╹◡╹)ﾉ",
				"color:#f8faff;font-weight:bold;font-size:6em;padding:10px 30px;background: linear-gradient(to right top, #FFC0CB, #ADD8E6);" );
			console.log( "magic v" + magic_version );

			window[ "Magic-App-Init-Main" ] && window[ "Magic-App-Init-Main" ]( magic.AppMain );

			window[ "__M_SCRIPT" ][ main ]( parserM( "magic-app-main" ) );
		}
	}
} )();