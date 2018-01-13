"use strict";

const File = require( "./file" );

module.exports = {
	sendDocument: function( res, pageName, data = {} ) {
		return Promise.all( [
			File.readWithFallback( "docs/style.local.css", "docs/style.css" ),
			File.readWithFallback( `docs/${pageName}.local.html`, `docs/${pageName}.html` ),
		] )
			.then( ( [style, content] ) => {
				res.writeHead( 200, {
					"Content-Type": "text/html; charset=utf8",
				} );
				res.end( content.replace( /(?:\/\*\*?\s*|<!--\s*)?%%([^%]+)%%(?:\s*\*\/|\s*-->)?/gi, ( all, name ) => {
					name = name.toLowerCase();

					switch ( name ) {
						case "css" :
							return style;

						default :
							return data.hasOwnProperty( name ) ? data[name] : all;
					}
				} ) );
			} );
	},

	sendError: function( res, error ) {
		if ( process.env.NODE_ENV === "development" ) {
			console.error( "responding on error:", error );
		}

		res.writeHead( error.httpCode || 500, {
			"Content-Type": "text/html; charset=utf8",
		} );
		res.end( "System error" );
	},
};
