import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import fastify from "fastify";
import { imageRouter } from "./router";

const server = fastify({
  maxParamLength: 5000,
});

server.register(fastifyTRPCPlugin, {
  prefix: "/trpc",
  trpcOptions: { router: imageRouter },
});

(async () => {
  try {
    await server.listen({ port: +(process.env.PORT || 3000) });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
})();
