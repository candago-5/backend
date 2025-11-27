import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { mockUser, mockUserWithoutPassword } from '../fixtures/test-data';

// Mock Prisma first
import { prismaMock } from '../mocks/prisma.mock';

// Mock bcryptjs
import bcrypt from 'bcryptjs';
jest.mock('bcryptjs');
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

// Import service after mocks
import { UserService } from '../../src/services/user.service';

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return user by id', async () => {
      // Arrange
      const userId = mockUser.id;
      const userWithCount = {
        ...mockUserWithoutPassword,
        _count: { dogs: 3 },
      };

      prismaMock.user.findUnique.mockResolvedValue(userWithCount as any);

      // Act
      const result = await userService.findById(userId);

      // Assert
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          createdAt: true,
          _count: {
            select: { dogs: true },
          },
        },
      });
      expect(result).toEqual(userWithCount);
    });

    it('should return null if user not found', async () => {
      // Arrange
      const userId = 'non-existent-id';

      prismaMock.user.findUnique.mockResolvedValue(null);

      // Act
      const result = await userService.findById(userId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return user by email', async () => {
      // Arrange
      const email = mockUser.email;

      prismaMock.user.findUnique.mockResolvedValue(mockUserWithoutPassword as any);

      // Act
      const result = await userService.findByEmail(email);

      // Assert
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: email.toLowerCase() },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          createdAt: true,
        },
      });
      expect(result).toEqual(mockUserWithoutPassword);
    });

    it('should convert email to lowercase', async () => {
      // Arrange
      const email = 'UPPERCASE@EXAMPLE.COM';

      prismaMock.user.findUnique.mockResolvedValue(null);

      // Act
      await userService.findByEmail(email);

      // Assert
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'uppercase@example.com' },
        select: expect.any(Object),
      });
    });

    it('should return null if user not found', async () => {
      // Arrange
      const email = 'nonexistent@example.com';

      prismaMock.user.findUnique.mockResolvedValue(null);

      // Act
      const result = await userService.findByEmail(email);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should successfully update user', async () => {
      // Arrange
      const userId = mockUser.id;
      const updateInput = {
        name: 'Updated Name',
        avatar: 'https://example.com/avatar.jpg',
      };

      const updatedUser = {
        ...mockUserWithoutPassword,
        ...updateInput,
      };

      prismaMock.user.update.mockResolvedValue(updatedUser as any);

      // Act
      const result = await userService.update(userId, updateInput);

      // Assert
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateInput,
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          createdAt: true,
        },
      });
      expect(result.name).toBe(updateInput.name);
      expect(result.avatar).toBe(updateInput.avatar);
    });

    it('should update only name', async () => {
      // Arrange
      const userId = mockUser.id;
      const updateInput = { name: 'New Name' };

      prismaMock.user.update.mockResolvedValue({
        ...mockUserWithoutPassword,
        name: updateInput.name,
      } as any);

      // Act
      const result = await userService.update(userId, updateInput);

      // Assert
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateInput,
        select: expect.any(Object),
      });
      expect(result.name).toBe(updateInput.name);
    });

    it('should update only avatar', async () => {
      // Arrange
      const userId = mockUser.id;
      const updateInput = { avatar: 'https://example.com/new-avatar.jpg' };

      prismaMock.user.update.mockResolvedValue({
        ...mockUserWithoutPassword,
        avatar: updateInput.avatar,
      } as any);

      // Act
      const result = await userService.update(userId, updateInput);

      // Assert
      expect(result.avatar).toBe(updateInput.avatar);
    });
  });

  describe('changePassword', () => {
    it('should successfully change password', async () => {
      // Arrange
      const userId = mockUser.id;
      const changePasswordInput = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword',
      };

      const hashedNewPassword = 'hashed_new_password';

      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true as never);
      mockBcrypt.hash.mockResolvedValue(hashedNewPassword as never);
      prismaMock.user.update.mockResolvedValue({
        ...mockUser,
        password: hashedNewPassword,
      });

      // Act
      const result = await userService.changePassword(userId, changePasswordInput);

      // Assert
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { id: userId } });
      expect(mockBcrypt.compare).toHaveBeenCalledWith(
        changePasswordInput.currentPassword,
        mockUser.password
      );
      expect(mockBcrypt.hash).toHaveBeenCalledWith(changePasswordInput.newPassword, 12);
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { password: hashedNewPassword },
      });
      expect(result).toBe(true);
    });

    it('should throw error if user not found', async () => {
      // Arrange
      const userId = 'non-existent-id';
      const changePasswordInput = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword',
      };

      prismaMock.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(userService.changePassword(userId, changePasswordInput)).rejects.toThrow(
        'Usuário não encontrado'
      );
      expect(mockBcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw error if current password is incorrect', async () => {
      // Arrange
      const userId = mockUser.id;
      const changePasswordInput = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword',
      };

      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(false as never);

      // Act & Assert
      await expect(userService.changePassword(userId, changePasswordInput)).rejects.toThrow(
        'Senha atual incorreta'
      );
      expect(mockBcrypt.hash).not.toHaveBeenCalled();
      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });

    it('should hash new password with bcrypt rounds of 12', async () => {
      // Arrange
      const userId = mockUser.id;
      const changePasswordInput = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword',
      };

      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true as never);
      mockBcrypt.hash.mockResolvedValue('hashed' as never);
      prismaMock.user.update.mockResolvedValue(mockUser);

      // Act
      await userService.changePassword(userId, changePasswordInput);

      // Assert
      expect(mockBcrypt.hash).toHaveBeenCalledWith('newpassword', 12);
    });
  });

  describe('delete', () => {
    it('should successfully delete user', async () => {
      // Arrange
      const userId = mockUser.id;

      prismaMock.user.delete.mockResolvedValue(mockUser);

      // Act
      const result = await userService.delete(userId);

      // Assert
      expect(prismaMock.user.delete).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(result).toBe(true);
    });

    it('should throw error if user not found', async () => {
      // Arrange
      const userId = 'non-existent-id';

      prismaMock.user.delete.mockRejectedValue(new Error('User not found'));

      // Act & Assert
      await expect(userService.delete(userId)).rejects.toThrow();
    });
  });

  describe('getStats', () => {
    it('should return user statistics', async () => {
      // Arrange
      const userId = mockUser.id;
      const totalDogs = 10;
      const dogsFound = 6;
      const dogsLost = 4;

      prismaMock.dog.count
        .mockResolvedValueOnce(totalDogs)
        .mockResolvedValueOnce(dogsFound)
        .mockResolvedValueOnce(dogsLost);

      // Act
      const result = await userService.getStats(userId);

      // Assert
      expect(prismaMock.dog.count).toHaveBeenCalledTimes(3);
      expect(prismaMock.dog.count).toHaveBeenNthCalledWith(1, { where: { userId } });
      expect(prismaMock.dog.count).toHaveBeenNthCalledWith(2, {
        where: { userId, status: 'encontrado' },
      });
      expect(prismaMock.dog.count).toHaveBeenNthCalledWith(3, {
        where: { userId, status: 'perdido' },
      });
      expect(result).toEqual({
        totalDogs,
        dogsFound,
        dogsLost,
      });
    });

    it('should return zero stats for user with no dogs', async () => {
      // Arrange
      const userId = mockUser.id;

      prismaMock.dog.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      // Act
      const result = await userService.getStats(userId);

      // Assert
      expect(result).toEqual({
        totalDogs: 0,
        dogsFound: 0,
        dogsLost: 0,
      });
    });
  });
});
