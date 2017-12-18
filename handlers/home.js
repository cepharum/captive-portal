"use strict";

const Response = require( "../lib/response" );

module.exports = function( req, res ) {
	Response.sendDocument( res, "index", {
		leasetime: process.env.CP_MAX_LEASE_TIME,
	} ).catch( error => Response.sendError( res, error ) );
};
