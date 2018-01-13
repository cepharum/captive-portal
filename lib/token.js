"use strict";

/**
 * Implements simple representation of fixed-length random token consisting of
 * (case-insensitive) English letters and digits.
 */
class Token {
	/**
	 * @param {int} length fixed length of token value to be generated
	 */
	constructor( length ) {
		const start = Date.now();

		Object.defineProperties( this, {
			/**
			 * @name Token#value
			 * @type {int}
			 * @readonly
			 */
			value: { value: generateToken( length ) },

			/**
			 * @name Token#age
			 * @type {int}
			 * @readonly
			 */
			age: { get: () => Date.now() - start, },
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


/**
 * Generates random token of requested length.
 *
 * @param {int} length
 * @returns {string} generated token value
 */
function generateToken( length ) {
	const alphabet = "abcdefghijkmnopqrstuvwxyz23456789";

	let secret = "";
	for ( let i = 0; i < length; i++ ) {
		secret += alphabet.charAt( Math.floor( Math.random() * alphabet.length ) );
	}

	return secret;
}



module.exports = {
	Token,
};
