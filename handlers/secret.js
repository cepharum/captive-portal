"use strict";

const Secret = require( "../lib/secret" );
const File = require( "../lib/file" );
const Response = require( "../lib/response" );


module.exports = function( req, res ) {
	File.read( "/etc/hostapd/hostapd.conf" )
		.then( ( wlanConfig ) => {
			const [ , ssid ] = /^\s*ssid\s*=\s*(.+)\s*$/mi.exec( wlanConfig );

			return Response.sendDocument( res, "secret", {
				ssid,
				secret: Secret.getCurrent().value,
				age: Math.round( Secret.getCurrent().age / 1000 ),
				maxage: Math.round( Secret.getCurrent().maxAge / 1000 ),
			} );
		} )
		.catch( error => Response.sendError( res, error ) );
};
