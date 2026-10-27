import app from "./app";
import { config } from "./config/env";
import { logger } from "./utils/logger";
import { prisma } from "./config/prisma";

const server = app.listen(config.port, "0.0.0.0", () => {
  logger.info("=======================================================");
  logger.info(" Injibara Campus Lost & Found API Server Online");
  logger.info(` Environment: ${config.env}`);
  logger.info(` Listening:   http://0.0.0.0:${config.port}${config.apiPrefix}`);
  logger.info(
    ` Health:      http://localhost:${config.port}${config.apiPrefix}/health`,
  );
  logger.info(` API Docs:    http://localhost:${config.port}/api/docs`);
  logger.info("=======================================================");
});

const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    logger.info("HTTP server closed.");
    await prisma.$disconnect();
    logger.info("Database connections closed.");
    process.exit(0);
  });

  setTimeout(() => {
    logger.error("Forceful shutdown after timeout.");
    process.exit(1);
  }, 10000);
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

export default server;
