"use strict";

const { Token } = require( "./token" );



const secrets = new Array( 2 );

/**
 * Declares length of secrets in characters.
 *
 * @type {int}
 */
const SecretLength = 5;

/**
 * Defines interval in ms for renewing secret.
 *
 * @type {int}
 */
const SecretMaxAge = ( process.env.NODE_ENV === "production" ? 5 * 60 : 30 ) * 1000;

/**
 * Defines time in ms for accepting an actually outdated secret.
 *
 * @type {int}
 */
const validOverlapping = 5 * 1000;



setInterval( renewSecret, SecretMaxAge );

renewSecret();

function renewSecret() {
	secrets[1] = secrets[0];
	secrets[0] = new Token( SecretLength );
}


module.exports = {
	/**
	 * Fetches current secret.
	 *
	 * @returns {Token}
	 */
	getCurrent: () => secrets[0],

	maxAge: SecretMaxAge,

	/**
	 * Checks if provided input is matching current secret.
	 *
	 * @note For sake of convenient the recent secret is kept valid for 5s since
	 *       switching to new secret.
	 *
	 * @param {string} input
	 * @returns {boolean}
	 */
	isValid: input => {
		if ( secrets[0].isValid( input ) ) {
			return true;
		}

		if ( secrets[1] && secrets[1].age - SecretMaxAge < validOverlapping ) {
			return secrets[1].isValid( input );
		}

		return false;
	}
};
