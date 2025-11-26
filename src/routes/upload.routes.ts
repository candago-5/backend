import { Router, Request, Response } from 'express';
import multer from 'multer';
import uploadService from '../services/upload.service';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas'));
    }
  }
});

/**
 * POST /api/upload
 * Upload an image file
 */
router.post(
  '/',
  authMiddleware,
  upload.single('image'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Nenhuma imagem fornecida'
          }
        });
        return;
      }

      const imageUrl = await uploadService.uploadFile(req.file);

      res.json({
        message: 'Imagem enviada com sucesso',
        imageUrl
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao enviar imagem';
      res.status(400).json({
        error: {
          code: 'UPLOAD_ERROR',
          message
        }
      });
    }
  }
);

/**
 * POST /api/upload/base64
 * Upload an image from base64 string
 */
router.post('/base64', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { image, mimeType } = req.body;

    if (!image) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Imagem em base64 é obrigatória'
        }
      });
      return;
    }

    const imageUrl = await uploadService.uploadBase64(image, mimeType);

    res.json({
      message: 'Imagem enviada com sucesso',
      imageUrl
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao enviar imagem';
    res.status(400).json({
      error: {
        code: 'UPLOAD_ERROR',
        message
      }
    });
  }
});

/**
 * DELETE /api/upload
 * Delete an uploaded image
 */
router.delete('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'URL da imagem é obrigatória'
        }
      });
      return;
    }

    const deleted = await uploadService.deleteFile(imageUrl);

    if (deleted) {
      res.json({ message: 'Imagem removida com sucesso' });
    } else {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Imagem não encontrada'
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'DELETE_ERROR',
        message: 'Erro ao remover imagem'
      }
    });
  }
});

export default router;

