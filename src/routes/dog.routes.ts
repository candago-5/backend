import { Router, Request, Response } from 'express';
import dogService from '../services/dog.service';
import { authMiddleware, optionalAuthMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

/**
 * GET /api/dogs
 * List all dogs with pagination
 */
router.get('/', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await dogService.findAll(page, limit);

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'LIST_ERROR',
        message: 'Erro ao listar cachorros'
      }
    });
  }
});

/**
 * GET /api/dogs/map
 * Get dogs for map display (optimized with less data)
 */
router.get('/map', async (req: Request, res: Response) => {
  try {
    const { north, south, east, west } = req.query;

    let bounds;
    if (north && south && east && west) {
      bounds = {
        north: parseFloat(north as string),
        south: parseFloat(south as string),
        east: parseFloat(east as string),
        west: parseFloat(west as string),
      };
    }

    const dogs = await dogService.getForMap(bounds);

    res.json({
      markers: dogs.map(dog => ({
        id: dog.id,
        latitude: dog.latitude,
        longitude: dog.longitude,
        imageUrl: dog.imageUrl,
        description: dog.description,
        status: dog.status,
        breed: dog.breed,
      }))
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'MAP_ERROR',
        message: 'Erro ao buscar marcadores do mapa'
      }
    });
  }
});

/**
 * GET /api/dogs/search
 * Search dogs with filters
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const {
      q: query,
      status,
      size,
      breed,
      lat,
      lng,
      radius
    } = req.query;

    const filters = {
      query: query as string,
      status: status as string,
      size: size as string,
      breed: breed as string,
      latitude: lat ? parseFloat(lat as string) : undefined,
      longitude: lng ? parseFloat(lng as string) : undefined,
      radiusKm: radius ? parseFloat(radius as string) : undefined,
    };

    const dogs = await dogService.search(filters);

    res.json({ dogs });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'SEARCH_ERROR',
        message: 'Erro ao buscar cachorros'
      }
    });
  }
});

/**
 * GET /api/dogs/my
 * Get current user's dogs
 */
router.get('/my', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const dogs = await dogService.findByUser(req.userId!);
    res.json({ dogs });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'LIST_ERROR',
        message: 'Erro ao listar seus cachorros'
      }
    });
  }
});

/**
 * GET /api/dogs/:id
 * Get a single dog by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const dog = await dogService.findById(id);

    if (!dog) {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Cachorro não encontrado'
        }
      });
      return;
    }

    res.json({ dog });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'FETCH_ERROR',
        message: 'Erro ao buscar cachorro'
      }
    });
  }
});

/**
 * POST /api/dogs
 * Create a new dog sighting
 */
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const {
      description,
      imageUrl,
      latitude,
      longitude,
      breed,
      color,
      size,
      status
    } = req.body;

    if (!description || latitude === undefined || longitude === undefined) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Descrição, latitude e longitude são obrigatórios'
        }
      });
      return;
    }

    const dog = await dogService.create({
      description,
      imageUrl,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      breed,
      color,
      size,
      status,
      userId: req.userId!
    });

    res.status(201).json({
      message: 'Cachorro registrado com sucesso',
      dog
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao registrar cachorro';
    res.status(400).json({
      error: {
        code: 'CREATE_ERROR',
        message
      }
    });
  }
});

/**
 * PUT /api/dogs/:id
 * Update a dog
 */
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      description,
      imageUrl,
      latitude,
      longitude,
      breed,
      color,
      size,
      status
    } = req.body;

    const dog = await dogService.update(id, req.userId!, {
      description,
      imageUrl,
      latitude: latitude !== undefined ? parseFloat(latitude) : undefined,
      longitude: longitude !== undefined ? parseFloat(longitude) : undefined,
      breed,
      color,
      size,
      status
    });

    res.json({
      message: 'Cachorro atualizado com sucesso',
      dog
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao atualizar cachorro';
    res.status(400).json({
      error: {
        code: 'UPDATE_ERROR',
        message
      }
    });
  }
});

/**
 * DELETE /api/dogs/:id
 * Delete a dog
 */
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await dogService.delete(id, req.userId!);

    res.json({
      message: 'Cachorro removido com sucesso'
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao remover cachorro';
    res.status(400).json({
      error: {
        code: 'DELETE_ERROR',
        message
      }
    });
  }
});

export default router;

