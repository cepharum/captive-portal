"use strict";

const HTTP = require( "http" );

const ShowDocument = require( "./handlers/home" );
const ProcessInput = require( "./handlers/input" );
const Shutdown = require( "./handlers/shutdown" );
const SecretDisplay = require( "./handlers/secret" );


const gator = HTTP.createServer( ( req, res ) => {
	console.log( `ap ${req.method} ${req.url} ${req.socket.remoteAddress}` );

	switch ( req.method ) {
		case "POST" :
			ProcessInput( req, res );
			break;
		default :
			ShowDocument( req, res );
	}
} );

gator.listen( process.env.CP_PUBLIC_PORT || 3000, process.env.CP_PUBLIC_IP || "0.0.0.0", () => console.log( `now listening for new clients at http://${gator.address().address}:${gator.address().port}` ) );


const osd = HTTP.createServer( ( req, res ) => {
	console.log( `display ${req.method} ${req.url} ${req.socket.remoteAddress}` );

	switch ( req.method ) {
		case "DELETE" :
		case "SHUTDOWN" :
			Shutdown( req, res, [gator, osd] );
			break;
		default :
			SecretDisplay( req, res );
	}
} );

osd.listen( process.env.CP_SECRET_PORT || 3001, process.env.CP_SECRET_IP || "127.0.0.1", () => console.log( `now listening for OSD at http://${osd.address().address}:${osd.address().port}` ) );
