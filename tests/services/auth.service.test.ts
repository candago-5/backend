import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { mockUser, mockUserWithoutPassword, mockJwtSecret } from '../fixtures/test-data';

// Mock Prisma first
import { prismaMock } from '../mocks/prisma.mock';

// Mock bcryptjs
import bcrypt from 'bcryptjs';
jest.mock('bcryptjs');
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

// Mock jsonwebtoken
import jwt from 'jsonwebtoken';
jest.mock('jsonwebtoken');
const mockJwt = jwt as jest.Mocked<typeof jwt>;

// Import service after mocks
import { AuthService } from '../../src/services/auth.service';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    // Set JWT_SECRET for testing
    process.env.JWT_SECRET = mockJwtSecret;
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      // Arrange
      const registerInput = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      };

      const hashedPassword = 'hashed_password';
      const token = 'generated.jwt.token';

      prismaMock.user.findUnique.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue(hashedPassword as never);
      prismaMock.user.create.mockResolvedValue({
        ...mockUser,
        email: registerInput.email,
        name: registerInput.name,
        password: hashedPassword,
      });
      mockJwt.sign.mockReturnValue(token as any);

      // Act
      const result = await authService.register(registerInput);

      // Assert
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerInput.email.toLowerCase() },
      });
      expect(mockBcrypt.hash).toHaveBeenCalledWith(registerInput.password, 12);
      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: {
          email: registerInput.email.toLowerCase(),
          password: hashedPassword,
          name: registerInput.name,
        },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });
      expect(result.user.email).toBe(registerInput.email);
      expect(result.token).toBe(token);
    });

    it('should throw error if email already exists', async () => {
      // Arrange
      const registerInput = {
        email: mockUser.email,
        password: 'password123',
      };

      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(authService.register(registerInput)).rejects.toThrow('Email já cadastrado');
      expect(mockBcrypt.hash).not.toHaveBeenCalled();
      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });

    it('should register user without name', async () => {
      // Arrange
      const registerInput = {
        email: 'noname@example.com',
        password: 'password123',
      };

      const hashedPassword = 'hashed_password';
      const token = 'generated.jwt.token';

      prismaMock.user.findUnique.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue(hashedPassword as never);
      prismaMock.user.create.mockResolvedValue({
        ...mockUser,
        email: registerInput.email,
        name: null,
        password: hashedPassword,
      });
      mockJwt.sign.mockReturnValue(token as any);

      // Act
      const result = await authService.register(registerInput);

      // Assert
      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: {
          email: registerInput.email.toLowerCase(),
          password: hashedPassword,
          name: null,
        },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });
      expect(result.user.name).toBeNull();
    });

    it('should convert email to lowercase', async () => {
      // Arrange
      const registerInput = {
        email: 'UPPERCASE@EXAMPLE.COM',
        password: 'password123',
        name: 'Test User',
      };

      prismaMock.user.findUnique.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue('hashed' as never);
      prismaMock.user.create.mockResolvedValue({
        ...mockUser,
        email: registerInput.email.toLowerCase(),
      });
      mockJwt.sign.mockReturnValue('token' as any);

      // Act
      await authService.register(registerInput);

      // Assert
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'uppercase@example.com' },
      });
    });
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      // Arrange
      const loginInput = {
        email: mockUser.email,
        password: 'correct_password',
      };

      const token = 'generated.jwt.token';

      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true as never);
      mockJwt.sign.mockReturnValue(token as any);

      // Act
      const result = await authService.login(loginInput);

      // Assert
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginInput.email.toLowerCase() },
      });
      expect(mockBcrypt.compare).toHaveBeenCalledWith(loginInput.password, mockUser.password);
      expect(mockJwt.sign).toHaveBeenCalledWith(
        { userId: mockUser.id },
        mockJwtSecret,
        { expiresIn: '7d' }
      );
      expect(result.user.id).toBe(mockUser.id);
      expect(result.user.email).toBe(mockUser.email);
      expect(result.token).toBe(token);
    });

    it('should throw error if user not found', async () => {
      // Arrange
      const loginInput = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      prismaMock.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.login(loginInput)).rejects.toThrow('Credenciais inválidas');
      expect(mockBcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw error if password is invalid', async () => {
      // Arrange
      const loginInput = {
        email: mockUser.email,
        password: 'wrong_password',
      };

      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(false as never);

      // Act & Assert
      await expect(authService.login(loginInput)).rejects.toThrow('Credenciais inválidas');
      expect(mockJwt.sign).not.toHaveBeenCalled();
    });

    it('should convert email to lowercase during login', async () => {
      // Arrange
      const loginInput = {
        email: 'UPPERCASE@EXAMPLE.COM',
        password: 'password123',
      };

      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true as never);
      mockJwt.sign.mockReturnValue('token' as any);

      // Act
      await authService.login(loginInput);

      // Assert
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'uppercase@example.com' },
      });
    });
  });

  describe('validateToken', () => {
    it('should successfully validate a valid token', async () => {
      // Arrange
      const token = 'valid.jwt.token';
      const decoded = { userId: mockUser.id };

      mockJwt.verify.mockReturnValue(decoded as any);

      // Act
      const result = await authService.validateToken(token);

      // Assert
      expect(mockJwt.verify).toHaveBeenCalledWith(token, mockJwtSecret);
      expect(result).toEqual(decoded);
    });

    it('should return null for invalid token', async () => {
      // Arrange
      const token = 'invalid.jwt.token';

      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act
      const result = await authService.validateToken(token);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null for expired token', async () => {
      // Arrange
      const token = 'expired.jwt.token';

      mockJwt.verify.mockImplementation(() => {
        throw new jwt.TokenExpiredError('jwt expired', new Date());
      });

      // Act
      const result = await authService.validateToken(token);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null for malformed token', async () => {
      // Arrange
      const token = 'malformed.token';

      mockJwt.verify.mockImplementation(() => {
        throw new jwt.JsonWebTokenError('jwt malformed');
      });

      // Act
      const result = await authService.validateToken(token);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('JWT token generation', () => {
    it('should generate token with correct payload and options', async () => {
      // Arrange
      const registerInput = {
        email: 'test@example.com',
        password: 'password123',
      };

      prismaMock.user.findUnique.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue('hashed' as never);
      prismaMock.user.create.mockResolvedValue({
        ...mockUser,
        email: registerInput.email,
      });
      mockJwt.sign.mockReturnValue('token' as any);

      // Act
      await authService.register(registerInput);

      // Assert
      expect(mockJwt.sign).toHaveBeenCalledWith(
        { userId: mockUser.id },
        mockJwtSecret,
        { expiresIn: '7d' }
      );
    });

    it('should use default secret if JWT_SECRET not set', () => {
      // Arrange
      delete process.env.JWT_SECRET;

      // Act
      const service = new AuthService();

      // Assert - service should be created without error
      expect(service).toBeDefined();
    });
  });
});
