import { compiler_init } from "./core/compiler/init.js"
import { printf } from "./core/global/printf.js";
import { language } from "./core/util/suggest-symbol.js";
import { argv } from "process";
import { runApp } from "./core/command/run-app.js";
import { initProject } from "./core/command/init-project.js";

function help() {
	console.log(
		"help\n" +
		"init\n" +
		"command\n" +
		"build\n" +
		""
	);
}

function index() {
	language( "cn" );

	const command = argv[ 2 ];
	if ( command === "build" ) {
		if ( argv.length < 4 ) throw `Insufficient parameter`;
		compiler_init();
	} else if ( command === "run" ) {
		if ( argv.length < 4 ) throw `Insufficient parameter`;
		runApp();
	} else if ( command === "build-run" ) {
		if ( argv.length < 4 ) throw `Insufficient parameter`;
		compiler_init();
		runApp();
	} else if ( command === "help" ) {
		help();
	} else if ( command === "init" ) {
		initProject();
	} else help();
}

try {
	index();
} catch ( e ) {
	printf.error( e );
}