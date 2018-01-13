"use strict";

const { resolve } = require( "path" );
const { spawn } = require( "child_process" );

const { Token } = require( "../lib/token" );
const Response = require( "../lib/response" );

global.currentShutdownToken = new Token( 32 ).value;


module.exports = function( req, res, services ) {
	console.log( "got SHUTDOWN request" );

	const required = global.currentShutdownToken;
	const provided = req.headers["x-token"];

	console.log( `required: ${required} - provided: ${provided}` );

	if ( !required || required !== provided ) {
		Response.sendError( res, Object.assign( new Error( "invalid token" ), { httpCode: 403 } ) );
		return;
	}


	const script = spawn( resolve( __dirname, "../system/shutdown.sh" ) );
	script.on( "close", code => {
		console.error( `shutting down device exited with ${code}` );

		res.writeHead( 200 );
		res.end();

		setTimeout( () => {
			services.forEach( service => {
				service.close();
			} );
		}, 3000 );
	} );

	script.on( "error", () => {
		console.error( `shutting down device failed` );
		console.error( error );

		Response.sendError( res, new Error( "script shutting down device failed" ) );
	} );
};
