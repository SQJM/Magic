import { runTask } from "../util/task.js";
import * as readline from "node:readline";
import { printf } from "../global/printf.js";
import fs from "fs";
import path from "path";

export const initProject = () => {
	runTask( "init project", () => {
		const runDir = process.cwd();

		const rl = readline.createInterface( {
			input : process.stdin,
			output : process.stdout
		} );

		const questions = [
			'your project name:\n',
			'your project platform:\n'
		];

		const answers = [];

		function askQuestion( index ) {
			if ( index < questions.length ) {
				rl.question( questions[ index ], ( answer ) => {
					answers.push( answer.trim() );
					askQuestion( index + 1 );
				} );
			} else {
				rl.close();
			}
		}

		askQuestion( 0 );

		rl.on( 'close', () => {
			const project = {
				name : answers[ 0 ],
				src : "app",
				main : "index",
				"build-dir" : "build",
				platform : answers[ 1 ]
			};

			try {
				const p_d = path.normalize( `${ runDir }/${ project.name }` );
				fs.mkdirSync( p_d );
				fs.mkdirSync( `${ p_d }/${ project.src }` );
				fs.writeFileSync( `${ p_d }/build.magic-config`, JSON.stringify( {
					"src" : project.src,
					"main" : project.main,
					"build-dir" : project[ "build-dir" ],
					[ project.platform ] : {}
				}, null, 2 ) );
				fs.writeFileSync( `${ p_d }/${ project.src }/app.magic-config`, JSON.stringify( {
					"app" : {
						"title" : project.name
					}
				}, null, 4 ) );
			} catch ( e ) {
				printf.error( e );
			}
		} );
	} );
}