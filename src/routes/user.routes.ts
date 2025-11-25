import { Router, Response } from 'express';
import userService from '../services/user.service';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

/**
 * GET /api/users/me
 * Get current user profile
 */
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await userService.findById(req.userId!);

    if (!user) {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Usuário não encontrado'
        }
      });
      return;
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'FETCH_ERROR',
        message: 'Erro ao buscar perfil'
      }
    });
  }
});

/**
 * GET /api/users/me/stats
 * Get current user statistics
 */
router.get('/me/stats', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const stats = await userService.getStats(req.userId!);
    res.json({ stats });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'FETCH_ERROR',
        message: 'Erro ao buscar estatísticas'
      }
    });
  }
});

/**
 * PUT /api/users/me
 * Update current user profile
 */
router.put('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { name, avatar } = req.body;

    const user = await userService.update(req.userId!, { name, avatar });

    res.json({
      message: 'Perfil atualizado com sucesso',
      user
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao atualizar perfil';
    res.status(400).json({
      error: {
        code: 'UPDATE_ERROR',
        message
      }
    });
  }
});

/**
 * PUT /api/users/me/password
 * Change user password
 */
router.put('/me/password', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Senha atual e nova senha são obrigatórias'
        }
      });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'A nova senha deve ter pelo menos 6 caracteres'
        }
      });
      return;
    }

    await userService.changePassword(req.userId!, { currentPassword, newPassword });

    res.json({
      message: 'Senha alterada com sucesso'
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao alterar senha';
    res.status(400).json({
      error: {
        code: 'PASSWORD_ERROR',
        message
      }
    });
  }
});

/**
 * DELETE /api/users/me
 * Delete current user account
 */
router.delete('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await userService.delete(req.userId!);

    res.json({
      message: 'Conta removida com sucesso'
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'DELETE_ERROR',
        message: 'Erro ao remover conta'
      }
    });
  }
});

export default router;

