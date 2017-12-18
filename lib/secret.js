"use strict";

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
const interval = ( process.env.NODE_ENV === "production" ? 5 * 60 : 30 ) * 1000;

/**
 * Defines time in ms for accepting an actually outdated secret.
 *
 * @type {int}
 */
const validOverlapping = 5 * 1000;



class Secret {
	constructor( value ) {
		const start = Date.now();

		Object.defineProperties( this, {
			/**
			 * @name Secret#value
			 * @type {int}
			 * @readonly
			 */
			value: { value },

			/**
			 * @name Secret#age
			 * @type {int}
			 * @readonly
			 */
			age: { get: () => Date.now() - start, },

			/**
			 * @name Secret#maxAge
			 * @type {int}
			 * @readonly
			 */
			maxAge: { value: interval },
		} );
	}

	/**
	 * Detects if provided input value is matching current secret.
	 *
	 * @param {string} input
	 * @returns {boolean}
	 */
	isValid( input ) {
		if ( typeof input !== "string" || !input.length ) {
			return false;
		}

		return input.toLowerCase() === this.value;
	}
}



setInterval( renewSecret, interval );

renewSecret();

function renewSecret() {
	secrets[1] = secrets[0];

	const alphabet = "abcdefghijkmnopqrstuvwxyz23456789";

	let secret = "";
	for ( let i = 0; i < SecretLength; i++ ) {
		secret += alphabet.charAt( Math.floor( Math.random() * alphabet.length ) );
	}

	console.log( `secret is now: ${secret}` );

	secrets[0] = new Secret( secret );
}


module.exports = {
	getCurrent: () => secrets[0],

	isValid: input => {
		if ( secrets[0].isValid( input ) ) {
			return true;
		}

		if ( secrets[1] ) {
			if ( secrets[1].age - secrets[1].maxAge < validOverlapping ) {
				return secrets[1].isValid( input );
			}
		}

		return false;
	}
};
