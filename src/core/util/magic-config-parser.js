import fs from "fs";
import { runTask } from "./task.js";
import { Macro } from "./macro.js";
import path from "path";
import { JsonTypeDetermination } from "./json-type-determination.js";
import { App_MagicConfig_Type, Build_MagicConfig_Type } from "../type/magic-config-type.js";
import { outError } from "./error.js";
import { _$ } from "./suggest-symbol.js";

const m = {
	"project.magic-config" : Build_MagicConfig_Type,
	"app.magic-config" : App_MagicConfig_Type
}

export const MagicConfigParser = ( filePath, callback = () => {} ) => {
	let content = null,
		data = null;
	filePath = path.normalize( filePath )
	const name = path.basename( filePath );

	runTask( `read ${ name }`, () => {
		content = fs.readFileSync( filePath, "utf8" );
	} );

	runTask( `parser ${ name } content`, () => {
		if ( content ) {
			data = JSON.parse( Macro.parser( content.toString() ) );
		}
	} );

	if ( m[ name ] ) {
		JsonTypeDetermination( m[ name ], data, ( bool, e ) => {
			if ( !bool ) throw outError( `${ name } ${ _$( "[@*] [#=] [*^]" ) } ${ e }.\n${ _$( "[%&]" ) }: ${ filePath }` );
		} );
	}

	callback( data );
	return data;
};