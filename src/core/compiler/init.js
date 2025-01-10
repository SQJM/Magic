import { BuildProject } from "./build-project.js";
import { BuildApp } from "./build-app.js";
import { MagicConfigParser } from "../util/magic-config-parser.js";
import { __magic_app } from "../../magic-app.js";
import { runTask } from "../util/task.js";
import { outError } from "../util/error.js";
import { _$ } from "../util/suggest-symbol.js";
import fs from "fs";
import path from "path";

function GetConfig() {
	const result = {};
	result[ "build" ] = MagicConfigParser( __magic_app.project.dir + "/build.magic-config", ( build_config ) => {
		runTask( "build.magic-config examine", () => {
			const examineFn = ( key, mk, k ) => {
				if ( !key && key === undefined ) throw outError( `${ mk } ${ _$( "[*^] [!?]" ) } ${ k }` );
			}
			examineFn( build_config[ "main" ], "build", "main" );
			examineFn( build_config[ "build-dir" ], "build", "build-dir" );
			examineFn( build_config[ "src" ], "build", "src" );
		} );
	} );
	result[ "app" ] = MagicConfigParser( `${ __magic_app.project.dir }/${ result[ "build" ][ "src" ] }/app.magic-config`, () => {
		const build_config = result[ "build" ];
		runTask( "init", () => {
			const projectDirPath = `${ __magic_app.project.dir }/${ build_config[ "src" ] }`;
			if ( !fs.existsSync( projectDirPath ) ) throw outError( `project dir ${ _$( "[!?]" ) }` );
			__magic_app.project.srcDir = path.normalize( `${ __magic_app.project.dir }/${ build_config[ "src" ] }` );
		} );
	} );
	return result;
}

export const compiler_init = () => {
	const magic_config = GetConfig();
	magic_config.build = BuildProject( magic_config );
	BuildApp( magic_config );
};