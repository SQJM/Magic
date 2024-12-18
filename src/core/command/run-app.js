import { MagicConfigParser } from "../util/magic-config-parser.js";
import { __magic_app } from "../../magic-app.js";
import { runTask } from "../util/task.js";
import { platform } from "../global/platform.js";
import { outError } from "../util/error.js";
import { _$ } from "../util/suggest-symbol.js";
import fs from "fs";
import { exec } from "node:child_process";
import { printf } from "../global/printf.js";

const app = {
	"node-webkit" : ( platform_config ) => {
		const build_dir = `${ __magic_app.project.dir }/${ platform_config[ "build-dir" ] }`;

		fs.copyFileSync( __magic_app.runDir + "/core/runtime/platform/node-webkit.js", `${ build_dir }/magic/init.js` );

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
			platform_config[ "config" ] = platform_config[ "main" ];
			const newPk = Object.assign( pkJson, platform_config[ "config" ] );
			fs.writeFileSync( pk, JSON.stringify( newPk ) );
		} catch ( e ) {
			throw e;
		}

		const command = `${ platform_config[ "app" ] } ${ __magic_app.project.dir }`;
		console.log( command )
		exec( command, ( error, stdout, stderr ) => {
			if ( error ) {
				throw error;
			}
			printf.log( stdout );
			printf.error( stderr );
		} );
	}
};

export const runApp = () => {
	MagicConfigParser( __magic_app.project.dir + "/build.magic-config", ( build_config ) => {
		let platform_config = null;

		runTask( "platform examine", () => {
			for ( const p of platform ) {
				if ( build_config[ p ] ) {
					platform_config = {
						name : p,
						app : build_config[ p ][ "app" ],
						config : build_config[ p ][ "config" ]
					};
					break;
				}
			}
			if ( !platform_config ) throw outError( "Unknown platform" );
		} );

		runTask( "build.magic-config examine", () => {
			const examineFn = ( key, mk, k ) => {
				if ( !key && key === undefined ) throw outError( `${ mk } ${ _$( "[*^] [!?]" ) } ${ k }` );
			}
			examineFn( build_config[ "main" ], "build", "main" );
			examineFn( build_config[ "build-dir" ], "build", "build-dir" );
		} );

		runTask( "command init", () => {
			platform_config[ "build-dir" ] = build_config[ "build-dir" ];
			platform_config[ "main" ] = `${ build_config[ "main" ] }/index.html`;
			app[ platform_config[ "name" ] ]( platform_config );
		} );
	} );
}