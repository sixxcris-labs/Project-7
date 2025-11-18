import { randomUUID } from "crypto";
import type { FastifyInstance } from "fastify";
import fastifyWebsocket from "@fastify/websocket";
import type { StreamSubscribeMessage } from "@common/types/marketData";
import { marketStreamManager } from "../services/marketStreamManager";

export async function marketStreamPlugin(app: FastifyInstance) {
  await app.register(fastifyWebsocket);

  app.get(
    "/markets",
    { websocket: true },
    (connection, req) => {
      const clientId = randomUUID();
      marketStreamManager.onClientConnect(clientId, connection.socket);

      const cleanup = () => {
        marketStreamManager.onClientDisconnect(clientId);
      };

      connection.socket.on("message", (raw) => {
        try {
          const msg = JSON.parse(raw.toString()) as StreamSubscribeMessage;
          marketStreamManager.handleClientMessage(clientId, msg);
        } catch (err) {
          app.log.warn({ err }, "Invalid stream message");
          if (connection.socket.readyState === connection.socket.OPEN) {
            connection.socket.send(JSON.stringify({ type: "error", message: "invalid payload" }));
          }
        }
      });

      connection.socket.on("close", cleanup);
      connection.socket.on("error", cleanup);
    },
  );
}
