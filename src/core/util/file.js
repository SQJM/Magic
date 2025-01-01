import path from "path";
import fs from "fs";
import * as readline from "node:readline";


export const File = ( () => {
	function matchesRule( filePath, rules ) {
		const fileName = path.basename( filePath );
		return rules.some( rule => {
			if ( rule.includes( '*' ) ) {
				const regex = new RegExp( rule.replace( /\*/g, '.*' ).toLowerCase() );
				return regex.test( fileName.toLowerCase() );
			} else if ( rule.includes( '/' ) ) {
				return filePath.toLowerCase() === rule.toLowerCase();
			} else {
				return fileName.toLowerCase() === rule.toLowerCase();
			}
		} );
	}

	function isFilterFile( filePath, rules ) {
		return !matchesRule( filePath, rules );
	}

	function createFileWithDirectories( filePath, data ) {
		const directoryPath = path.dirname( filePath );

		function createDirectories( dirPath ) {
			if ( !fs.existsSync( dirPath ) ) {
				createDirectories( path.dirname( dirPath ) );
				fs.mkdirSync( dirPath );
			}
		}

		createDirectories( directoryPath );

		if ( !fs.existsSync( filePath ) ) fs.writeFileSync( filePath, data );
	}

	function copyFileWithDirectories( srcPath, targetPath ) {
		const directoryPath = path.dirname( targetPath );

		function createDirectories( dirPath ) {
			if ( !fs.existsSync( dirPath ) ) {
				createDirectories( path.dirname( dirPath ) );
				fs.mkdirSync( dirPath );
			}
		}

		createDirectories( directoryPath );

		fs.copyFileSync( srcPath, targetPath );
	}

	function readFileLine( filePath ) {
		const fileStream = fs.createReadStream( filePath );

		const reader = readline.createInterface( {
			input : fileStream,
			crlfDelay : Infinity
		} );

		return new Promise( ( resolve, reject ) => {
			reader.on( 'line', ( line ) => {
				resolve( line );
				reader.close();
			} );

			reader.on( 'error', ( error ) => {
				reject( error );
			} );

			reader.on( 'close', () => {
				fileStream.destroy();
			} );
		} );
	}

	function getFullExtension( filePath ) {
		const lastDotIndex = filePath.indexOf( '.' );
		if ( lastDotIndex === -1 || lastDotIndex === filePath.length - 1 ) {
			return '';
		}
		return filePath.substring( lastDotIndex );
	}

	return {
		isFilterFile,
		createFileWithDirectories,
		copyFileWithDirectories,
		readFileLine,
		getFullExtension
	};
} )();