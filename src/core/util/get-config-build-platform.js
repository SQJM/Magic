import { runTask } from "./task.js";
import { platform } from "../global/platform.js";
import { outError } from "./error.js";

export function GetConfigBuildPlatform( build_config ) {
	let platform_config = null;

	runTask( "platform examine", () => {
		for ( const p of platform ) {
			if ( build_config[ p ] ) {
				platform_config = {
					name : p,
					...build_config[ p ]
				};
				break;
			}
		}
		if ( !platform_config ) throw outError( "Unknown platform" );
	} );
	return platform_config;
}