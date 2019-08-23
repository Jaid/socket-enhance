/** @module socket-enhance */

import {isObject} from "util"

import socketioWildcard from "socketio-wildcard"
import epochSeconds from "epoch-seconds"
import {isString, isFunction, isBuffer, isNumber, isArrayLike} from "lodash"

/**
 * @typedef {Object} JaidLoggerLike
 * @prop {Function} error
 * @prop {Function} warn
 * @prop {Function} info
 * @prop {Function} debug
 */

/**
 * @typedef {Object} ConstructorOptions
 * @prop {JaidLoggerLike} logger
 * @prop {string} [loggingLevel="info"]
 */

/**
 * @typedef {Object} Options
 * @prop {JaidLoggerLike} logger
 */

/**
 * @class
 * @example
 * import socketIo from "socket.io"
 * import {enhanceSocketServer} from "socket-enhance"
 * const server = socketIo(1234)
 * enchanceSocketServer(server)
 */
export default class SocketEnhancer {

  /**
   * @constructor
   * @param {ConstructorOptions} options
   */
  constructor({logger, loggingLevel = "info"}) {
    this.log = function () {
      logger[loggingLevel](...arguments)
    }
  }

  static formatPayload(payload) {
    if (isBuffer(payload)) {
      return `Buffer[${payload.length}]`
    }
    if (isNumber(payload)) {
      return payload
    }
    if (isString(payload)) {
      if (payload.length > 24) {
        return `${payload.substr(0, 12)}…${payload.substr(-12)}`
      } else {
        return payload
      }
    }
    if (isArrayLike(payload)) {
      return `Array[${payload.length}]`
    }
    if (isFunction(payload)) {
      return "function"
    }
    if (isObject(payload)) {
      return `Object[${Object.keys(payload).length}]`
    }
    return payload
  }

  /**
   * @return {import("socketio-wildcard").default}
   */
  getServerWildcardMiddleware() {
    if (!this.serverWildcardMiddleware) {
      this.serverWildcardMiddleware = socketioWildcard()
    }
    return this.serverWildcardMiddleware
  }

  /**
   * @param {import("socket.io").Server} server
   */
  enhanceServer(server) {
    server.use(this.getServerWildcardMiddleware())
    server.on("connection", serverSocket => {
      this.enhanceServerSocket(serverSocket)
    })
  }

  /**
   * @param {import("socket.io").Socket} serverSocket
   */
  enhanceServerSocket(serverSocket) {
    const timestamp = epochSeconds()
    this.log("◀︎ New socket %s from %s", serverSocket.id, serverSocket.conn.transport.socket?._socket?.remoteAddress || serverSocket.handshake.address)
    serverSocket.on("*", packet => {
      const [eventName, ...payload] = packet.data
      this.log("◀︎ %s [%s] %s", serverSocket.id, eventName, payload.map(SocketEnhancer.formatPayload).join(" "))
    })
    const serverSocketEmit = serverSocket.emit
    serverSocket.emit = (...args) => {
      const [eventName, ...payload] = args
      if (!["disconnecting", "disconnect"].includes(eventName)) {
        this.log("▶︎ %s [%s] %s", serverSocket.id, eventName, payload.map(SocketEnhancer.formatPayload).join(" "))
      }
      serverSocketEmit.apply(serverSocket, args)
    }
    serverSocket.on("disconnect", () => {
      this.log("Socket %s disconnected after %s seconds", serverSocket.id, epochSeconds(timestamp))
    })
  }

}