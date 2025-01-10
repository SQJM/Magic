import { Logging } from "../util/logging.js";
import { MagicConfig } from "./magic-config.js";

const log = new Logging( "Magic", "./Magic.log", null, MagicConfig[ "[Magic.log]-max-size" ] );
export const printf = ( () => {
	return {
		error : ( ...args ) => {
			log.error( ...args );
		},
		log : ( ...args ) => {
			log.log( ...args );
		}
	}
} )();