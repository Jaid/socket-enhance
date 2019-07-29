/** @module socket-enhance */

/**
 * Returns the number of seconds passed since Unix epoch (01 January 1970)
 * @function
 * @returns {number} Seconds since epoch
 * @example
 * import socketEnhance from "socket-enhance"
 * const result = socketEnhance()
 * result === 1549410770
 */
export default () => Math.floor(Date.now() / 1000)