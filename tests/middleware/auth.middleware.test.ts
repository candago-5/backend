import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { mockUser, mockJwtSecret } from '../fixtures/test-data';

// Mock Prisma first
import { prismaMock } from '../mocks/prisma.mock';

// Mock jsonwebtoken
import jwt from 'jsonwebtoken';
jest.mock('jsonwebtoken');
const mockJwt = jwt as jest.Mocked<typeof jwt>;

// Import middleware after mocks
import { authMiddleware, optionalAuthMiddleware, AuthRequest } from '../../src/middleware/auth.middleware';

describe('Auth Middleware', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    process.env.JWT_SECRET = mockJwtSecret;

    mockRequest = {
      headers: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as any;

    mockNext = jest.fn() as NextFunction;

    jest.clearAllMocks();
  });

  describe('authMiddleware', () => {
    it('should authenticate user with valid token', async () => {
      // Arrange
      const token = 'valid.jwt.token';
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      const decoded = { userId: mockUser.id };
      mockJwt.verify.mockReturnValue(decoded as any);
      prismaMock.user.findUnique.mockResolvedValue({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
      } as any);

      // Act
      await authMiddleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockJwt.verify).toHaveBeenCalledWith(token, mockJwtSecret);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        select: { id: true, email: true, name: true },
      });
      expect(mockRequest.userId).toBe(mockUser.id);
      expect(mockRequest.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
      });
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 401 if no authorization header', async () => {
      // Arrange
      mockRequest.headers = {};

      // Act
      await authMiddleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Token não fornecido',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 if authorization header does not start with Bearer', async () => {
      // Arrange
      mockRequest.headers = {
        authorization: 'Basic username:password',
      };

      // Act
      await authMiddleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Token não fornecido',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 if token is invalid', async () => {
      // Arrange
      const token = 'invalid.jwt.token';
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      mockJwt.verify.mockImplementation(() => {
        throw new jwt.JsonWebTokenError('invalid token');
      });

      // Act
      await authMiddleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Token inválido',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 if token is expired', async () => {
      // Arrange
      const token = 'expired.jwt.token';
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      const expiredError = new jwt.TokenExpiredError('jwt expired', new Date());
      Object.setPrototypeOf(expiredError, jwt.JsonWebTokenError.prototype);
      mockJwt.verify.mockImplementation(() => {
        throw expiredError;
      });

      // Act
      await authMiddleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Token inválido',
        },
      });
    });

    it('should return 401 if user not found', async () => {
      // Arrange
      const token = 'valid.jwt.token';
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      const decoded = { userId: 'non-existent-user-id' };
      mockJwt.verify.mockReturnValue(decoded as any);
      prismaMock.user.findUnique.mockResolvedValue(null);

      // Act
      await authMiddleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Usuário não encontrado',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 500 on unexpected error', async () => {
      // Arrange
      const token = 'valid.jwt.token';
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      mockJwt.verify.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      // Act
      await authMiddleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'AUTH_ERROR',
          message: 'Erro na autenticação',
        },
      });
    });

    it('should use default JWT_SECRET if not set', async () => {
      // Arrange
      delete process.env.JWT_SECRET;
      const token = 'valid.jwt.token';
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      const decoded = { userId: mockUser.id };
      mockJwt.verify.mockReturnValue(decoded as any);
      prismaMock.user.findUnique.mockResolvedValue({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
      } as any);

      // Act
      await authMiddleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockJwt.verify).toHaveBeenCalledWith(token, 'default_secret');
    });
  });

  describe('optionalAuthMiddleware', () => {
    it('should authenticate user with valid token', async () => {
      // Arrange
      const token = 'valid.jwt.token';
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      const decoded = { userId: mockUser.id };
      mockJwt.verify.mockReturnValue(decoded as any);
      prismaMock.user.findUnique.mockResolvedValue({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
      } as any);

      // Act
      await optionalAuthMiddleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockRequest.userId).toBe(mockUser.id);
      expect(mockRequest.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
      });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue without authentication if no token', async () => {
      // Arrange
      mockRequest.headers = {};

      // Act
      await optionalAuthMiddleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockRequest.userId).toBeUndefined();
      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should continue without authentication if token is invalid', async () => {
      // Arrange
      const token = 'invalid.jwt.token';
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      mockJwt.verify.mockImplementation(() => {
        throw new jwt.JsonWebTokenError('invalid token');
      });

      // Act
      await optionalAuthMiddleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockRequest.userId).toBeUndefined();
      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should continue without authentication if user not found', async () => {
      // Arrange
      const token = 'valid.jwt.token';
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      const decoded = { userId: 'non-existent-user-id' };
      mockJwt.verify.mockReturnValue(decoded as any);
      prismaMock.user.findUnique.mockResolvedValue(null);

      // Act
      await optionalAuthMiddleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockRequest.userId).toBeUndefined();
      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should not authenticate if authorization header is not Bearer', async () => {
      // Arrange
      mockRequest.headers = {
        authorization: 'Basic username:password',
      };

      // Act
      await optionalAuthMiddleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockRequest.userId).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle token expired gracefully', async () => {
      // Arrange
      const token = 'expired.jwt.token';
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      mockJwt.verify.mockImplementation(() => {
        throw new jwt.TokenExpiredError('jwt expired', new Date());
      });

      // Act
      await optionalAuthMiddleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockRequest.userId).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
