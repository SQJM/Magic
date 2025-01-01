import { Var } from "./var.js";
import { _$ } from "../util/suggest-symbol.js";

function _typeof( t, v ) {
	const obj = {
		unlink : false,
		ex : typeof t,
		rt : typeof v,
		e : ""
	};
	if ( typeof t !== typeof v ) obj[ "unlink" ] = true;
	return obj;
}

const array_ItemType_string = ( t ) => {
	const obj = _typeof( t, Var.array );
	if ( obj[ "unlink" ] ) return obj;
	let i = 0;
	for ( const v of t ) {
		if ( typeof v !== "string" ) {
			return {
				unlink : true,
				ex : "string",
				rt : typeof v,
				e : `${ _$( "[%%] [&-] [%-]" ) } : ${ i }`
			}
		}
		i++;
	}
	return obj;
}

const array_ItemType_string$object = ( t ) => {
	const obj = _typeof( t, Var.array );
	if ( obj[ "unlink" ] ) return obj;
	let i = 0;
	for ( const v of t ) {
		if ( typeof v !== "string" && typeof v !== "object" ) {
			return {
				unlink : true,
				ex : "string",
				rt : typeof v,
				e : `${ _$( "[%%] [&-] [%-]" ) } : ${ i }`
			}
		}
		i++;
	}
	return obj;
}

export const App_MagicConfig_Type = ( () => {
	return {
		"import-script" : ( t ) => array_ItemType_string$object( t ),
		"import-style" : ( t ) => array_ItemType_string$object( t ),
		"app" : {
			"lang" : ( t ) => _typeof( t, Var.string ),
			"title" : ( t ) => _typeof( t, Var.string )
		}
	}
} )();

export const Project_MagicConfig_Type = ( () => {
	return {
		"info" : {
			"name" : ( t ) => _typeof( t, Var.string ),
			"version" : ( t ) => _typeof( t, Var.string ),
			"author" : ( t ) => _typeof( t, Var.string ),
			"description" : ( t ) => _typeof( t, Var.string ),
			"license" : ( t ) => _typeof( t, Var.string )
		}
	}
} )();

export const Build_MagicConfig_Type = ( () => {
	return {
		"src" : ( t ) => _typeof( t, Var.string ),
		"ui" : ( t ) => _typeof( t, Var.string ),
		"main" : ( t ) => _typeof( t, Var.string ),
		"excludeDir" : ( t ) => array_ItemType_string( t ),
		"exclude" : ( t ) => array_ItemType_string( t ),
		"build-dir" : ( t ) => _typeof( t, Var.string ),
		"min-code" : {
			"js" : ( t ) => _typeof( t, Var.boolean ),
			"css" : ( t ) => _typeof( t, Var.boolean ),
			"html" : ( t ) => _typeof( t, Var.boolean )
		}
	}
} )();