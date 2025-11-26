import { Router, Request, Response } from 'express';
import authService from '../services/auth.service';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email e senha são obrigatórios'
        }
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'A senha deve ter pelo menos 6 caracteres'
        }
      });
      return;
    }

    const result = await authService.register({ email, password, name });

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: result.user,
      token: result.token
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao registrar';
    res.status(400).json({
      error: {
        code: 'REGISTER_ERROR',
        message
      }
    });
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email e senha são obrigatórios'
        }
      });
      return;
    }

    const result = await authService.login({ email, password });

    res.json({
      message: 'Login realizado com sucesso',
      user: result.user,
      token: result.token
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao fazer login';
    res.status(401).json({
      error: {
        code: 'LOGIN_ERROR',
        message
      }
    });
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    res.json({
      user: req.user
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'AUTH_ERROR',
        message: 'Erro ao buscar usuário'
      }
    });
  }
});

/**
 * POST /api/auth/validate
 * Validate a JWT token
 */
router.post('/validate', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Token é obrigatório'
        }
      });
      return;
    }

    const decoded = await authService.validateToken(token);

    if (decoded) {
      res.json({ valid: true, userId: decoded.userId });
    } else {
      res.json({ valid: false });
    }
  } catch (error) {
    res.json({ valid: false });
  }
});

export default router;

