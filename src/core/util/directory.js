import fs from "fs";
import path from "path";
import { File } from "./file.js";

export const Directory = ( () => {
	const getAllFiles = ( dirPath, operation = {
		exclude : [],
		excludeDir : []
	} ) => {
		let fileList = [];
		const files = fs.readdirSync( dirPath );

		for ( const file of files ) {
			const filePath = path.join( dirPath, file );
			const stats = fs.statSync( filePath );

			if ( stats.isDirectory() && !operation[ "excludeDir" ].includes( path.basename( filePath ) ) ) {
				fileList = [
					...fileList,
					...getAllFiles( filePath, operation )
				];
			} else if ( stats.isFile() && File.isFilterFile( filePath, operation[ "exclude" ] ) ) {
				fileList.push( filePath );
			}
		}

		return fileList;
	}

	return {
		getAllFiles
	}
} )();