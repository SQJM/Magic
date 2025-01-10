import { MagicConfigParser } from "../util/magic-config-parser.js";
import { __magic_app } from "../../magic-app.js";
import { runTask } from "../util/task.js";
import { outError } from "../util/error.js";
import { _$ } from "../util/suggest-symbol.js";
import fs from "fs";
import { exec } from "node:child_process";
import { printf } from "../global/printf.js";
import { GetConfigBuildPlatform } from "../util/get-config-build-platform.js";

const app = {
	"node-webkit" : ( platform_config ) => {
		try {
			const pk = `${ __magic_app.project.dir }/package.json`;
			if ( !fs.existsSync( pk ) ) {
				fs.writeFileSync( pk, "{}" );
			}

			let pkJson = {};

			const data = fs.readFileSync( pk ).toString();
			if ( data ) {
				pkJson = JSON.parse( data );
			}

			const newPk = Object.assign( pkJson, platform_config[ "config" ] );
			newPk[ "main" ] = platform_config[ "main" ];
			fs.writeFileSync( pk, JSON.stringify( newPk ) );
		} catch ( e ) {
			throw e;
		}

		const command = `${ platform_config[ "app" ] } ${ __magic_app.project.dir }`;
		exec( command, ( error, stdout, stderr ) => {
			if ( error ) {
				throw error;
			}
			printf.log( stdout );
			printf.error( stderr );
		} );
	},
	"web" : ( platform_config ) => {
		if ( platform_config[ "browser" ] ) {
			const command = `start ${ __magic_app.project.dir }/${ platform_config[ "main" ] }`;
			exec( command, ( error, stdout, stderr ) => {
				if ( error ) {
					throw error;
				}
				printf.log( stdout );
				printf.error( stderr );
			} );
		}
	}
};

export const runApp = () => {
	MagicConfigParser( __magic_app.project.dir + "/build.magic-config", ( build_config ) => {
		const platform_config = GetConfigBuildPlatform( build_config );

		runTask( "build.magic-config examine", () => {
			const examineFn = ( key, mk, k ) => {
				if ( !key && key === undefined ) throw outError( `${ mk } ${ _$( "[*^] [!?]" ) } ${ k }` );
			}
			examineFn( build_config[ "main" ], "build", "main" );
			examineFn( build_config[ "build-dir" ], "build", "build-dir" );
		} );

		runTask( "command init", () => {
			platform_config[ "build-dir" ] = build_config[ "build-dir" ];
			platform_config[ "main" ] = `${ platform_config[ "build-dir" ] }/index.html`;
			app[ platform_config[ "name" ] ]( platform_config );
		} );
	} );
}