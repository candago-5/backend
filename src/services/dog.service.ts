import prisma from '../config/database';
import mlService from './ml.service';

interface CreateDogInput {
  description: string;
  imageUrl?: string;
  latitude: number;
  longitude: number;
  breed?: string;
  color?: string;
  size?: string;
  status?: string;
  userId: string;
}

interface UpdateDogInput {
  description?: string;
  imageUrl?: string;
  latitude?: number;
  longitude?: number;
  breed?: string;
  color?: string;
  size?: string;
  status?: string;
}

interface SearchFilters {
  query?: string;
  status?: string;
  size?: string;
  breed?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
}

export class DogService {
  async create(input: CreateDogInput) {
    // Create the dog first
    let dog = await prisma.dog.create({
      data: {
        description: input.description,
        imageUrl: input.imageUrl,
        latitude: input.latitude,
        longitude: input.longitude,
        breed: input.breed,
        color: input.color,
        size: input.size,
        status: input.status || 'encontrado',
        userId: input.userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    // If image is provided but no breed, try to predict breed using ML
    if (input.imageUrl && !input.breed) {
      try {
        console.log(`🤖 Attempting breed prediction for dog ${dog.id}`);
        const prediction = await mlService.predictBreed(input.imageUrl, dog.id);
        
        if (prediction.breed) {
          // Update the dog with predicted breed
          dog = await prisma.dog.update({
            where: { id: dog.id },
            data: { breed: prediction.breed },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                }
              }
            }
          });
          console.log(`✅ Dog ${dog.id} breed updated to: ${prediction.breed}`);
        }
      } catch (error) {
        // ML prediction is optional, don't fail the dog creation
        console.error('ML prediction failed:', error);
      }
    }

    return dog;
  }

  async findById(id: string) {
    const dog = await prisma.dog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    return dog;
  }

  async findAll(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const [dogs, total] = await Promise.all([
      prisma.dog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      }),
      prisma.dog.count()
    ]);

    return {
      dogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async search(filters: SearchFilters) {
    const { query, status, size, breed, latitude, longitude, radiusKm } = filters;

    const where: any = {};

    if (query) {
      where.OR = [
        { description: { contains: query, mode: 'insensitive' } },
        { breed: { contains: query, mode: 'insensitive' } },
        { color: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (size) {
      where.size = size;
    }

    if (breed) {
      where.breed = { contains: breed, mode: 'insensitive' };
    }

    let dogs = await prisma.dog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    // Filter by location radius if provided
    if (latitude !== undefined && longitude !== undefined && radiusKm) {
      dogs = dogs.filter(dog => {
        const distance = this.calculateDistance(
          latitude,
          longitude,
          dog.latitude,
          dog.longitude
        );
        return distance <= radiusKm;
      });
    }

    return dogs;
  }

  async getForMap(bounds?: { north: number; south: number; east: number; west: number }) {
    const where: any = {};

    if (bounds) {
      where.latitude = {
        gte: bounds.south,
        lte: bounds.north
      };
      where.longitude = {
        gte: bounds.west,
        lte: bounds.east
      };
    }

    const dogs = await prisma.dog.findMany({
      where,
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
      take: 100 // Limit markers for performance
    });

    return dogs;
  }

  async update(id: string, userId: string, input: UpdateDogInput) {
    // Check ownership
    const existingDog = await prisma.dog.findFirst({
      where: { id, userId }
    });

    if (!existingDog) {
      throw new Error('Cachorro não encontrado ou você não tem permissão');
    }

    const dog = await prisma.dog.update({
      where: { id },
      data: input,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    return dog;
  }

  async delete(id: string, userId: string) {
    // Check ownership
    const existingDog = await prisma.dog.findFirst({
      where: { id, userId }
    });

    if (!existingDog) {
      throw new Error('Cachorro não encontrado ou você não tem permissão');
    }

    await prisma.dog.delete({
      where: { id }
    });

    return true;
  }

  async findByUser(userId: string) {
    const dogs = await prisma.dog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return dogs;
  }

  // Haversine formula to calculate distance between two points
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

export default new DogService();

