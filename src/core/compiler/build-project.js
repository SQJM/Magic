import { runTask } from "../util/task.js";
import fs from "fs";
import { __magic_app } from "../../magic-app.js";
import { Directory } from "../util/directory.js";
import { UUID } from "../util/uuid.js";
import { DatePro } from "../util/date-pro.js";
import { printf } from "../global/printf.js";
import { MagicConfig } from "../global/magic-config.js";
import { File } from "../util/file.js";
import path from "path";

export const BuildProject = ( magic_config ) => {
	const build_config = Object.assign( {
		"exclude" : [],
		"excludeDir" : [],
		"min-code" : {
			"js" : false,
			"css" : false,
			"html" : false
		}
	}, magic_config.build );
	const app_config = magic_config.app;

	const projectDirPath = `${ __magic_app.project.dir }/${ build_config[ "src" ] }`;

	runTask( "project init build", () => {
		const rulesFile = [
			"app.magic-config",
			"project.magic-config",
			...build_config[ "exclude" ]
		];
		const rulesDir = [ ...build_config[ "excludeDir" ] ];


		const import_file = {
			"script" : [],
			"style" : []
		}

		const judge_object = ( item ) => {
			if ( typeof item === "object" ) {
				const key = Object.keys( item )[ 0 ];
				return {
					src : key,
					cf : item[ key ]
				}
			}
			return null;
		}
		if ( app_config[ "import-script" ] )
			app_config[ "import-script" ].forEach( item => {
				const result = judge_object( item );

				const cf = {
					src : result ? result.src : item,
					module : false,
					mode : "link",
					load : "begin",
					attribute : []
				};

				const itemPath = path.normalize( `${ __magic_app.project.srcDir }/${ cf.src }` );
				const rcf = Object.assign( cf, result ? result.cf : {} );
				if ( fs.statSync( itemPath ).isFile() ) {
					if ( rcf[ "mode" ] === "inline" ) rcf[ "data" ] = fs.readFileSync( itemPath ).toString();
				}

				import_file[ "script" ].push( rcf );
			} );
		if ( app_config[ "import-style" ] )
			app_config[ "import-style" ].forEach( item => {
				const result = judge_object( item );

				const cf = {
					src : result ? result.src : item,
					mode : "link",
					load : "begin",
					attribute : []
				};

				const itemPath = path.normalize( `${ __magic_app.project.srcDir }/${ cf.src }` );
				if ( fs.statSync( itemPath ).isFile() ) {
					const rcf = Object.assign( cf, result ? result.cf : {} );
					if ( rcf[ "mode" ] === "inline" ) rcf[ "data" ] = fs.readFileSync( itemPath ).toString();
					import_file[ "style" ].push( rcf );
				}
			} );

		const files = Directory.getAllFiles( projectDirPath, {
			exclude : rulesFile,
			excludeDir : rulesDir
		} );

		try {
			const logPath = "./magic-project-build.log";
			if ( !fs.existsSync( logPath ) ) fs.writeFileSync( logPath, "" );
			const stats = fs.statSync( logPath );
			if ( stats.size > MagicConfig[ "[magic-project-build.log]-max-size" ] ) fs.writeFileSync( logPath, "" );
			fs.appendFileSync( logPath, `[${ DatePro.formatDate() }][${ UUID.generate() }]:${ JSON.stringify( magic_config ) }\n` );
		} catch ( e ) { printf.error( e ) }

		const build_dir = `${ __magic_app.project.dir }/${ build_config[ "build-dir" ] }`;
		const file_to_build = {};

		try {
			fs.rmSync( build_dir, {
				recursive : true,
				force : true
			} );
			fs.mkdirSync( build_dir );
			try {
				fs.mkdirSync( `${ build_dir }/magic` );
			} catch ( e ) {
				printf.error( e );
			}

			build_config[ "m-data" ] = [];
			files.forEach( ( filePath ) => {
				const target = filePath.substring( projectDirPath.length );
				const targetPath = path.normalize( `${ build_dir }${ target }` );
				const ext = File.getFullExtension( path.basename( target ) );
				if ( !file_to_build[ ext ] ) file_to_build[ ext ] = [];

				const data = fs.readFileSync( filePath ).toString( "utf8" );

				if ( ext === ".m" ) {
					const name = target.substring( 0, target.length - 2 ).replace( /[^a-zA-Z]/g, '' ).toLowerCase();
					build_config[ "m-data" ].push( {
						name : name,
						data : data
					} );
				} else {
					File.copyFileWithDirectories( filePath, targetPath );
					file_to_build[ ext ].push( targetPath );
				}
			} );
		} catch ( e ) { printf.error( e ) }

		build_config[ "build_dir" ] = build_dir || [];
		build_config[ "file_to_build" ] = file_to_build || [];
		build_config[ "import_file" ] = import_file || [];
	} );
	return build_config;
}