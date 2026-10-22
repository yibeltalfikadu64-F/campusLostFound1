import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Injibara Campus Lost & Found API',
      version: '1.0.0',
      description: 'Official production REST API documentation for Injibara University Campus Lost & Found System.',
      contact: {
        name: 'Injibara University IT and Campus Security Support',
        email: 'support@injibara.edu.et'
      }
    },
    servers: [
      {
        url: `http://localhost:${config.port}${config.apiPrefix}`,
        description: 'Local development server'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token'
        }
      }
    }
  },
  apis: ['./src/routes/*.ts']
};

export const swaggerSpec = swaggerJsdoc(options);
