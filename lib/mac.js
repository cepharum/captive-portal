"use strict";

const File = require( "./file" );

module.exports = {
	getOnIp: function( ip ) {
		return File.read( "/proc/net/arp" )
			.then( table => {
				let result = null;

				table
					.split( "\n" )
					.some( line => {
						const cells = line.trim().split( /\s+/ );
						if ( cells[0] === ip ) {
							result = cells[3];
							return true;
						}
					} );

				if ( result ) {
					return result;
				}

				throw new Error( `no such MAC matching provided IP: ${ip}` );
			} );
	}
};
