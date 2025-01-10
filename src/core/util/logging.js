import * as fs from "node:fs"
import * as path from "node:path";

export class Logging {
	oldCount = 1;
	logPath;
	oldData = [];

	constructor( name, logPath, callback = () => { }, maxSize = 1048576 ) {
		this.logPath = path.normalize( logPath );

		let bool = true;
		try {
			if ( fs.existsSync( logPath ) ) {
				const stats = fs.statSync( this.logPath );
				if ( stats.size > maxSize ) {
					fs.writeFileSync( this.logPath, `Logging - WJM - 1.0.0 [${ name }]\n` );
				} else bool = false;
			}
		} catch ( e ) { }
		bool && fs.writeFileSync( this.logPath, `Logging - WJM - 1.0.0 [${ name }]\n` );

		if ( typeof callback === Function ) callback();
	}

	#getDate() {
		const date = new Date();
		return `${ date.getFullYear() }-${ date.getMonth() + 1 }-${ date.getDate() } ${ date.getHours() }:${ date.getMinutes() }:${ date.getSeconds() }`;
	}

	#head( level ) {
		return `[${ this.#getDate() }] [${ level.toUpperCase() }] > `;
	}

	#body( level, data ) {
		let str = "";

		const toString = ( item ) => {
			try {
				if ( typeof item === 'object' && item.toString ) str += `${ item }`;
				else if ( typeof item === 'object' ) str += JSON.stringify( item );
				else str += `${ item }`;
			} catch ( e ) {
				str += `${ item }`;
			}
		}

		if ( Array.isArray( data ) ) {
			data.forEach( item => toString( item ) );
		} else {
			toString( data )
		}
		if ( str.trim() === "" ) return false;
		return this.#head( level ) + str;
	}

	#write( data, _data ) {
		if ( data === false ) return;
		if ( this.oldData === _data ) {
			this.oldCount++;
			return;
		}
		if ( this.oldCount !== 1 ) {
			fs.appendFileSync( this.logPath, this.oldCount + '...^\n' );
		}
		this.oldCount = 1;
		this.oldData = _data;
		fs.appendFileSync( this.logPath, data + '\n' );
	}

	log( ...args ) {
		console.log( ...args );
		this.#write( this.#body( 'LOG', args ), args );
	}

	error( ...args ) {
		console.error( ...args );
		this.#write( this.#body( 'ERROR', args ), args );
	}

	warning( ...args ) {
		console.warn( ...args );
		this.#write( this.#body( 'WARNING', args ), args );
	}

	info( ...args ) {
		console.info( ...args );
		this.#write( this.#body( 'INFO', args ), args );
	}
}