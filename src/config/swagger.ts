import swaggerUi from "swagger-ui-express";
import { Express } from "express";
import { env } from "./env";
import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { registry } from "./openapi";

export const generator = new OpenApiGeneratorV3(registry.definitions);

export const openApiDoc = generator.generateDocument({
  openapi: "3.0.0",
  info: {
    title: "API Documentation",
    version: "1.0.0",
  },
  servers: [
    {
      url: `http://localhost:${env.PORT}`,
      description: "Development server",
    },
  ],
});

openApiDoc.components = {
  securitySchemes: {
    ApiKeyAuth: {
      type: "apiKey",
      in: "header",
      name: "x-api-key",
      description: "API key required to access protected endpoints.",
    },
  },
};

openApiDoc.security = [
  {
    ApiKeyAuth: [],
  },
];

export function setupSwagger(app: Express): void {
  if (env.NODE_ENV !== "production") {
    app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiDoc));
  }
}
