import swaggerJsdoc from 'swagger-jsdoc';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Buddy Script API',
    version: '1.0.0',
    description: 'RESTful API documentation for Buddy Script social media platform. This API provides endpoints for user authentication, posts, comments, and reactions with a Facebook-style multi-reaction system.',
    contact: {
      name: 'API Support',
    },
  },
  servers: [
    {
      url: `http://localhost:${process.env.PORT || 8080}`,
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token from login/register endpoint',
      },
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'accessToken',
        description: 'JWT token stored in HTTP-only cookie',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          message: {
            type: 'string',
            example: 'Error message',
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            example: '507f1f77bcf86cd799439011',
          },
          firstName: {
            type: 'string',
            example: 'John',
          },
          lastName: {
            type: 'string',
            example: 'Doe',
          },
          email: {
            type: 'string',
            example: 'john.doe@example.com',
          },
          avatar: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                example: 'https://res.cloudinary.com/example/image/upload/v1234567890/avatar.jpg',
              },
              publicId: {
                type: 'string',
                example: 'avatar_abc123',
              },
            },
          },
        },
      },
      Post: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            example: '507f1f77bcf86cd799439011',
          },
          author: {
            type: 'string',
            example: '507f1f77bcf86cd799439011',
          },
          content: {
            type: 'string',
            example: 'This is a post content',
          },
          image: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                example: 'https://res.cloudinary.com/example/image/upload/v1234567890/post.jpg',
              },
              publicId: {
                type: 'string',
                example: 'post_abc123',
              },
            },
          },
          visibility: {
            type: 'string',
            enum: ['public', 'private'],
            example: 'public',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      Comment: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            example: '507f1f77bcf86cd799439011',
          },
          post: {
            type: 'string',
            example: '507f1f77bcf86cd799439011',
          },
          author: {
            type: 'string',
            example: '507f1f77bcf86cd799439011',
          },
          content: {
            type: 'string',
            example: 'This is a comment',
          },
          parentComment: {
            type: 'string',
            nullable: true,
            example: null,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      Reaction: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            example: '507f1f77bcf86cd799439011',
          },
          targetType: {
            type: 'string',
            enum: ['post', 'comment'],
            example: 'post',
          },
          targetId: {
            type: 'string',
            example: '507f1f77bcf86cd799439011',
          },
          user: {
            type: 'string',
            example: '507f1f77bcf86cd799439011',
          },
          reactionType: {
            type: 'string',
            enum: ['like', 'love', 'haha', 'care', 'angry'],
            example: 'like',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      ReactionBreakdown: {
        type: 'object',
        properties: {
          like: {
            type: 'object',
            properties: {
              count: {
                type: 'number',
                example: 5,
              },
              userIds: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
            },
          },
          love: {
            type: 'object',
            properties: {
              count: {
                type: 'number',
                example: 2,
              },
              userIds: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
            },
          },
          haha: {
            type: 'object',
            properties: {
              count: {
                type: 'number',
                example: 1,
              },
              userIds: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
            },
          },
          care: {
            type: 'object',
            properties: {
              count: {
                type: 'number',
                example: 0,
              },
              userIds: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
            },
          },
          angry: {
            type: 'object',
            properties: {
              count: {
                type: 'number',
                example: 0,
              },
              userIds: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
      SuccessResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          statusCode: {
            type: 'number',
            example: 200,
          },
          message: {
            type: 'string',
            example: 'Operation successful',
          },
          data: {
            type: 'object',
          },
        },
      },
    },
    responses: {
      BadRequest: {
        description: 'Bad request',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
          },
        },
      },
    },
  },
  tags: [
    {
      name: 'Health',
      description: 'Health check endpoints',
    },
    {
      name: 'Users',
      description: 'User authentication and profile management',
    },
    {
      name: 'Posts',
      description: 'Post creation, retrieval, and management',
    },
    {
      name: 'Comments',
      description: 'Comment and reply management',
    },
    {
      name: 'Reactions',
      description: 'Reaction management (Like, Love, Haha, Care, Angry)',
    },
  ],
};

const options = {
  definition: swaggerDefinition,
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
