import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { mockDog, mockDogWithUser, mockUser } from '../fixtures/test-data';

// Mock Prisma first
import { prismaMock } from '../mocks/prisma.mock';

// Mock ML service
jest.mock('../../src/services/ml.service', () => ({
  __esModule: true,
  default: {
    predictBreed: jest.fn(),
  },
}));

import mlService from '../../src/services/ml.service';
const mockMlService = mlService as jest.Mocked<typeof mlService>;

// Import service after mocks
import { DogService } from '../../src/services/dog.service';

describe('DogService', () => {
  let dogService: DogService;

  beforeEach(() => {
    dogService = new DogService();
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should successfully create a dog', async () => {
      // Arrange
      const createInput = {
        description: 'Cachorro encontrado',
        imageUrl: 'https://example.com/dog.jpg',
        latitude: -23.5505,
        longitude: -46.6333,
        breed: 'Labrador',
        color: 'Amarelo',
        size: 'grande',
        status: 'encontrado',
        userId: mockUser.id,
      };

      prismaMock.dog.create.mockResolvedValue(mockDogWithUser as any);

      // Act
      const result = await dogService.create(createInput);

      // Assert
      expect(prismaMock.dog.create).toHaveBeenCalledWith({
        data: createInput,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
      expect(result).toEqual(mockDogWithUser);
    });

    it('should default status to "encontrado" if not provided', async () => {
      // Arrange
      const createInput = {
        description: 'Cachorro encontrado',
        latitude: -23.5505,
        longitude: -46.6333,
        userId: mockUser.id,
      };

      prismaMock.dog.create.mockResolvedValue(mockDogWithUser as any);

      // Act
      await dogService.create(createInput);

      // Assert
      expect(prismaMock.dog.create).toHaveBeenCalledWith({
        data: {
          ...createInput,
          status: 'encontrado',
          imageUrl: undefined,
          breed: undefined,
          color: undefined,
          size: undefined,
        },
        include: expect.any(Object),
      });
    });

    it('should attempt ML breed prediction if image provided and no breed', async () => {
      // Arrange
      const createInput = {
        description: 'Cachorro encontrado',
        imageUrl: 'https://example.com/dog.jpg',
        latitude: -23.5505,
        longitude: -46.6333,
        userId: mockUser.id,
      };

      const dogWithoutBreed = { ...mockDogWithUser, breed: null };
      const dogWithBreed = { ...mockDogWithUser, breed: 'Predicted Breed' };

      prismaMock.dog.create.mockResolvedValue(dogWithoutBreed as any);
      mockMlService.predictBreed.mockResolvedValue({
        breed: 'Predicted Breed',
        confidence: 0.95,
      } as any);
      prismaMock.dog.update.mockResolvedValue(dogWithBreed as any);

      // Act
      const result = await dogService.create(createInput);

      // Assert
      expect(mockMlService.predictBreed).toHaveBeenCalledWith(
        createInput.imageUrl,
        dogWithoutBreed.id
      );
      expect(prismaMock.dog.update).toHaveBeenCalledWith({
        where: { id: dogWithoutBreed.id },
        data: { breed: 'Predicted Breed' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
      expect(result.breed).toBe('Predicted Breed');
    });

    it('should not attempt ML prediction if breed is provided', async () => {
      // Arrange
      const createInput = {
        description: 'Cachorro encontrado',
        imageUrl: 'https://example.com/dog.jpg',
        latitude: -23.5505,
        longitude: -46.6333,
        breed: 'Known Breed',
        userId: mockUser.id,
      };

      prismaMock.dog.create.mockResolvedValue(mockDogWithUser as any);

      // Act
      await dogService.create(createInput);

      // Assert
      expect(mockMlService.predictBreed).not.toHaveBeenCalled();
    });

    it('should not fail if ML prediction fails', async () => {
      // Arrange
      const createInput = {
        description: 'Cachorro encontrado',
        imageUrl: 'https://example.com/dog.jpg',
        latitude: -23.5505,
        longitude: -46.6333,
        userId: mockUser.id,
      };

      const dogWithoutBreed = { ...mockDogWithUser, breed: null };

      prismaMock.dog.create.mockResolvedValue(dogWithoutBreed as any);
      mockMlService.predictBreed.mockRejectedValue(new Error('ML service unavailable'));

      // Act
      const result = await dogService.create(createInput);

      // Assert
      expect(result).toEqual(dogWithoutBreed);
      expect(prismaMock.dog.update).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return dog by id', async () => {
      // Arrange
      const dogId = mockDog.id;

      prismaMock.dog.findUnique.mockResolvedValue(mockDogWithUser as any);

      // Act
      const result = await dogService.findById(dogId);

      // Assert
      expect(prismaMock.dog.findUnique).toHaveBeenCalledWith({
        where: { id: dogId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
      expect(result).toEqual(mockDogWithUser);
    });

    it('should return null if dog not found', async () => {
      // Arrange
      const dogId = 'non-existent-id';

      prismaMock.dog.findUnique.mockResolvedValue(null);

      // Act
      const result = await dogService.findById(dogId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return paginated dogs', async () => {
      // Arrange
      const page = 1;
      const limit = 50;
      const total = 100;
      const dogs = [mockDogWithUser, mockDogWithUser];

      prismaMock.dog.findMany.mockResolvedValue(dogs as any);
      prismaMock.dog.count.mockResolvedValue(total);

      // Act
      const result = await dogService.findAll(page, limit);

      // Assert
      expect(prismaMock.dog.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
      expect(result.dogs).toEqual(dogs);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 50,
        total: 100,
        totalPages: 2,
      });
    });

    it('should calculate correct pagination for page 2', async () => {
      // Arrange
      const page = 2;
      const limit = 50;

      prismaMock.dog.findMany.mockResolvedValue([]);
      prismaMock.dog.count.mockResolvedValue(100);

      // Act
      await dogService.findAll(page, limit);

      // Assert
      expect(prismaMock.dog.findMany).toHaveBeenCalledWith({
        skip: 50,
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      });
    });

    it('should use default pagination values', async () => {
      // Arrange
      prismaMock.dog.findMany.mockResolvedValue([]);
      prismaMock.dog.count.mockResolvedValue(0);

      // Act
      const result = await dogService.findAll();

      // Assert
      expect(prismaMock.dog.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      });
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(50);
    });
  });

  describe('search', () => {
    it('should search dogs with query', async () => {
      // Arrange
      const filters = { query: 'Labrador' };
      const dogs = [mockDogWithUser];

      prismaMock.dog.findMany.mockResolvedValue(dogs as any);

      // Act
      const result = await dogService.search(filters);

      // Assert
      expect(prismaMock.dog.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { description: { contains: 'Labrador', mode: 'insensitive' } },
            { breed: { contains: 'Labrador', mode: 'insensitive' } },
            { color: { contains: 'Labrador', mode: 'insensitive' } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
      expect(result).toEqual(dogs);
    });

    it('should filter by status', async () => {
      // Arrange
      const filters = { status: 'perdido' };

      prismaMock.dog.findMany.mockResolvedValue([]);

      // Act
      await dogService.search(filters);

      // Assert
      expect(prismaMock.dog.findMany).toHaveBeenCalledWith({
        where: { status: 'perdido' },
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      });
    });

    it('should filter by size', async () => {
      // Arrange
      const filters = { size: 'grande' };

      prismaMock.dog.findMany.mockResolvedValue([]);

      // Act
      await dogService.search(filters);

      // Assert
      expect(prismaMock.dog.findMany).toHaveBeenCalledWith({
        where: { size: 'grande' },
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      });
    });

    it('should filter by breed', async () => {
      // Arrange
      const filters = { breed: 'Labrador' };

      prismaMock.dog.findMany.mockResolvedValue([]);

      // Act
      await dogService.search(filters);

      // Assert
      expect(prismaMock.dog.findMany).toHaveBeenCalledWith({
        where: { breed: { contains: 'Labrador', mode: 'insensitive' } },
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      });
    });

    it('should filter by location radius', async () => {
      // Arrange
      const filters = {
        latitude: -23.5505,
        longitude: -46.6333,
        radiusKm: 5,
      };

      const nearbyDog = {
        ...mockDogWithUser,
        latitude: -23.5515,
        longitude: -46.6343,
      };

      const farDog = {
        ...mockDogWithUser,
        id: 'far-dog-id',
        latitude: -24.5505,
        longitude: -47.6333,
      };

      prismaMock.dog.findMany.mockResolvedValue([nearbyDog, farDog] as any);

      // Act
      const result = await dogService.search(filters);

      // Assert - should only include nearby dog
      expect(result.length).toBeLessThanOrEqual(1);
    });

    it('should combine multiple filters', async () => {
      // Arrange
      const filters = {
        query: 'Labrador',
        status: 'encontrado',
        size: 'grande',
      };

      prismaMock.dog.findMany.mockResolvedValue([]);

      // Act
      await dogService.search(filters);

      // Assert
      expect(prismaMock.dog.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { description: { contains: 'Labrador', mode: 'insensitive' } },
            { breed: { contains: 'Labrador', mode: 'insensitive' } },
            { color: { contains: 'Labrador', mode: 'insensitive' } },
          ],
          status: 'encontrado',
          size: 'grande',
        },
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      });
    });
  });

  describe('getForMap', () => {
    it('should return dogs for map without bounds', async () => {
      // Arrange
      const dogs = [
        {
          id: mockDog.id,
          latitude: mockDog.latitude,
          longitude: mockDog.longitude,
          imageUrl: mockDog.imageUrl,
          description: mockDog.description,
          status: mockDog.status,
          breed: mockDog.breed,
          createdAt: mockDog.createdAt,
        },
      ];

      prismaMock.dog.findMany.mockResolvedValue(dogs as any);

      // Act
      const result = await dogService.getForMap();

      // Assert
      expect(prismaMock.dog.findMany).toHaveBeenCalledWith({
        where: {},
        select: {
          id: true,
          latitude: true,
          longitude: true,
          imageUrl: true,
          description: true,
          status: true,
          breed: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
      expect(result).toEqual(dogs);
    });

    it('should filter by map bounds', async () => {
      // Arrange
      const bounds = {
        north: -23.5,
        south: -23.6,
        east: -46.6,
        west: -46.7,
      };

      prismaMock.dog.findMany.mockResolvedValue([]);

      // Act
      await dogService.getForMap(bounds);

      // Assert
      expect(prismaMock.dog.findMany).toHaveBeenCalledWith({
        where: {
          latitude: {
            gte: bounds.south,
            lte: bounds.north,
          },
          longitude: {
            gte: bounds.west,
            lte: bounds.east,
          },
        },
        select: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    });
  });

  describe('update', () => {
    it('should successfully update dog', async () => {
      // Arrange
      const dogId = mockDog.id;
      const userId = mockUser.id;
      const updateInput = {
        description: 'Updated description',
        status: 'adotado',
      };

      prismaMock.dog.findFirst.mockResolvedValue(mockDog);
      prismaMock.dog.update.mockResolvedValue({
        ...mockDogWithUser,
        ...updateInput,
      } as any);

      // Act
      const result = await dogService.update(dogId, userId, updateInput);

      // Assert
      expect(prismaMock.dog.findFirst).toHaveBeenCalledWith({
        where: { id: dogId, userId },
      });
      expect(prismaMock.dog.update).toHaveBeenCalledWith({
        where: { id: dogId },
        data: updateInput,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
      expect(result.description).toBe(updateInput.description);
    });

    it('should throw error if dog not found', async () => {
      // Arrange
      const dogId = 'non-existent-id';
      const userId = mockUser.id;

      prismaMock.dog.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(dogService.update(dogId, userId, {})).rejects.toThrow(
        'Cachorro não encontrado ou você não tem permissão'
      );
      expect(prismaMock.dog.update).not.toHaveBeenCalled();
    });

    it('should throw error if user is not owner', async () => {
      // Arrange
      const dogId = mockDog.id;
      const differentUserId = 'different-user-id';

      prismaMock.dog.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(dogService.update(dogId, differentUserId, {})).rejects.toThrow(
        'Cachorro não encontrado ou você não tem permissão'
      );
    });
  });

  describe('delete', () => {
    it('should successfully delete dog', async () => {
      // Arrange
      const dogId = mockDog.id;
      const userId = mockUser.id;

      prismaMock.dog.findFirst.mockResolvedValue(mockDog);
      prismaMock.dog.delete.mockResolvedValue(mockDog);

      // Act
      const result = await dogService.delete(dogId, userId);

      // Assert
      expect(prismaMock.dog.findFirst).toHaveBeenCalledWith({
        where: { id: dogId, userId },
      });
      expect(prismaMock.dog.delete).toHaveBeenCalledWith({
        where: { id: dogId },
      });
      expect(result).toBe(true);
    });

    it('should throw error if dog not found', async () => {
      // Arrange
      const dogId = 'non-existent-id';
      const userId = mockUser.id;

      prismaMock.dog.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(dogService.delete(dogId, userId)).rejects.toThrow(
        'Cachorro não encontrado ou você não tem permissão'
      );
      expect(prismaMock.dog.delete).not.toHaveBeenCalled();
    });

    it('should throw error if user is not owner', async () => {
      // Arrange
      const dogId = mockDog.id;
      const differentUserId = 'different-user-id';

      prismaMock.dog.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(dogService.delete(dogId, differentUserId)).rejects.toThrow();
    });
  });

  describe('findByUser', () => {
    it('should return all dogs for a user', async () => {
      // Arrange
      const userId = mockUser.id;
      const dogs = [mockDog, mockDog];

      prismaMock.dog.findMany.mockResolvedValue(dogs as any);

      // Act
      const result = await dogService.findByUser(userId);

      // Assert
      expect(prismaMock.dog.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(dogs);
    });

    it('should return empty array if user has no dogs', async () => {
      // Arrange
      const userId = mockUser.id;

      prismaMock.dog.findMany.mockResolvedValue([]);

      // Act
      const result = await dogService.findByUser(userId);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two points correctly', () => {
      // Arrange - São Paulo to Rio de Janeiro (approximately 360km)
      const lat1 = -23.5505;
      const lon1 = -46.6333;
      const lat2 = -22.9068;
      const lon2 = -43.1729;

      // Act - accessing private method through any
      const distance = (dogService as any).calculateDistance(lat1, lon1, lat2, lon2);

      // Assert - should be approximately 360km (allow 10km variance)
      expect(distance).toBeGreaterThan(350);
      expect(distance).toBeLessThan(370);
    });

    it('should return 0 for same location', () => {
      // Arrange
      const lat = -23.5505;
      const lon = -46.6333;

      // Act
      const distance = (dogService as any).calculateDistance(lat, lon, lat, lon);

      // Assert
      expect(distance).toBe(0);
    });

    it('should calculate small distances correctly', () => {
      // Arrange - Very close points (approximately 1km)
      const lat1 = -23.5505;
      const lon1 = -46.6333;
      const lat2 = -23.5515;
      const lon2 = -46.6343;

      // Act
      const distance = (dogService as any).calculateDistance(lat1, lon1, lat2, lon2);

      // Assert - should be approximately 1-2km
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(2);
    });
  });

  describe('toRad', () => {
    it('should convert degrees to radians', () => {
      // Arrange
      const degrees = 180;

      // Act
      const radians = (dogService as any).toRad(degrees);

      // Assert
      expect(radians).toBeCloseTo(Math.PI, 5);
    });

    it('should convert 0 degrees to 0 radians', () => {
      // Arrange
      const degrees = 0;

      // Act
      const radians = (dogService as any).toRad(degrees);

      // Assert
      expect(radians).toBe(0);
    });

    it('should convert 90 degrees to π/2 radians', () => {
      // Arrange
      const degrees = 90;

      // Act
      const radians = (dogService as any).toRad(degrees);

      // Assert
      expect(radians).toBeCloseTo(Math.PI / 2, 5);
    });
  });
});
