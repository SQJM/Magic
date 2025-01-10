import { compiler_init } from "./core/compiler/init.js"
import { printf } from "./core/global/printf.js";
import { language } from "./core/util/suggest-symbol.js";
import { argv } from "process";
import { runApp } from "./core/command/run-app.js";
import { initProject } from "./core/command/init-project.js";

function index() {
	language( "cn" );

	const command = argv[ 2 ];
	if ( command === "build" ) {
		compiler_init();
	} else if ( command === "run" ) {
		runApp();
	} else if ( command === "build-run" ) {
		compiler_init();
		runApp();
	} else if ( command === "init" ) {
		initProject();
	} else {
		console.log( `Magic : ${ command || "" } 未知命令` )
	}
}


try {
	index();
	console.log( "\nMagic ヾ(๑╹◡╹)ﾉ" );
} catch ( e ) {
	printf.error( e );
	console.log( "\nMagic ~~o(>_<)o ~~" );
}