"use strict";

const Secret = require( "../lib/secret" );
const Mac = require( "../lib/mac" );
const Response = require( "../lib/response" );

const File = require( "../lib/file" );


module.exports = function( req, res ) {
	new Promise( ( resolve, reject ) => {
		const chunks = [];

		req.on( "data", chunk => chunks.push( chunk ) );
		req.on( "end", () => resolve( Buffer.concat( chunks ).toString( "utf8" ) ) );
		req.on( "error", error => reject( error ) );
	} )
		.then( body => {
			const ptnPart = /([^=&]+)(?:=([^&]*))?(?:&|$)/g;
			const input = {};
			let match

			while ( match = ptnPart.exec( body ) ) {
				input[decodeURIComponent( match[1] )] = decodeURIComponent( match[2] );
			}

			if ( process.env.NODE_ENV === "development" ) {
				console.log( "got input:" );
				console.dir( input );
			}

			let promise;

			let page = Secret.isValid( input.code ) ? "granted" : "rejected";
			if ( page === "granted" ) {
				promise = Mac.getOnIp( req.socket.remoteAddress )
					.then( mac => File.write( "data/" + mac.replace( /:/g, "_" ) + ".mac", req.socket.remoteAddress ) )
					.catch( error => {
						console.error( "processing failed:", error );

						page = "processing-failed";
					} );
			} else {
				promise = Promise.resolve();
			}

			return promise.then( () => Response.sendDocument( res, page ) );
		} )
		.catch( error => Response.sendError( res, error ) );

};
