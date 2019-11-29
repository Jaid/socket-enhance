import path from "path"

import socketIo from "socket.io"
import socketIoClient from "socket.io-client"
import jaidLogger from "jaid-logger"
import delay from "delay"
import ms from "ms.macro"

const indexModule = (process.env.MAIN ? path.resolve(process.env.MAIN) : path.join(__dirname, "..", "src")) |> require

/**
 * @type { import("../src") }
 */
const {default: SocketEnhancer} = indexModule

it("should run", async callback => {
  let communicationWorks = false
  const logger = jaidLogger(`${_PKG_NAME}-test`)
  const enhancer = new SocketEnhancer({logger})
  const server = socketIo()
  enhancer.enhanceServer(server)
  server.on("connection", socket => {
    server.client = socket
    socket.on("hey", name => {
      logger.info("I am %s!", name)
      socket.emit("howdy", "🤠", "🐎", () => {})
    })
  })
  server.listen(44911)
  const client = socketIoClient("ws://localhost:44911")
  client.on("howdy", () => {
    communicationWorks = true
  })
  client.emit("hey", "you", Buffer.from("abc"))
  await delay(ms`3 seconds`)
  expect(communicationWorks).toBe(true)
  client.close()
  server.close(callback)
}, ms`10 seconds`)