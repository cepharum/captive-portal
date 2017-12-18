"use strict";

const Path = require( "path" );
const File = require( "fs" );

module.exports = {

	read,

	write: function( name, content ) {
		return new Promise( ( resolve, reject ) => {
			File.writeFile( Path.resolve( __dirname, "..", name ), content, { encoding: "utf8" }, error => {
				if ( error ) {
					reject( error );
				} else {
					resolve( content );
				}
			} );
		} );
	},

	readWithFallback( name, altName ) {
		return read( name )
			.catch( error => {
				if ( error.code !== "ENOENT" ) {
					throw error;
				}

				return read( altName );
			} );
	},

};




function read( name ) {
	return new Promise( ( resolve, reject ) => {
		File.readFile( Path.resolve( __dirname, "..", name ), ( error, content ) => {
			if ( error ) {
				reject( error );
			} else {
				resolve( content.toString( "utf8" ) );
			}
		} );
	} );
}
