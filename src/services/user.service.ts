import bcrypt from 'bcryptjs';
import prisma from '../config/database';

interface UpdateUserInput {
  name?: string;
  avatar?: string;
}

interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export class UserService {
  async findById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        createdAt: true,
        _count: {
          select: { dogs: true }
        }
      }
    });

    return user;
  }

  async findByEmail(email: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        createdAt: true,
      }
    });

    return user;
  }

  async update(id: string, input: UpdateUserInput) {
    const user = await prisma.user.update({
      where: { id },
      data: input,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        createdAt: true,
      }
    });

    return user;
  }

  async changePassword(id: string, input: ChangePasswordInput) {
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      input.currentPassword,
      user.password
    );

    if (!isCurrentPasswordValid) {
      throw new Error('Senha atual incorreta');
    }

    const hashedPassword = await bcrypt.hash(input.newPassword, 12);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword }
    });

    return true;
  }

  async delete(id: string) {
    await prisma.user.delete({
      where: { id }
    });

    return true;
  }

  async getStats(id: string) {
    const [totalDogs, dogsFound, dogsLost] = await Promise.all([
      prisma.dog.count({ where: { userId: id } }),
      prisma.dog.count({ where: { userId: id, status: 'encontrado' } }),
      prisma.dog.count({ where: { userId: id, status: 'perdido' } }),
    ]);

    return {
      totalDogs,
      dogsFound,
      dogsLost,
    };
  }
}

export default new UserService();

