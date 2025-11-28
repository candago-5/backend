export const mockUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'test@example.com',
  name: 'Test User',
  password: '$2a$12$hashed_password_here',
  avatar: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const mockDog = {
  id: '223e4567-e89b-12d3-a456-426614174000',
  description: 'Cachorro encontrado na praça',
  imageUrl: 'https://example.com/dog.jpg',
  latitude: -23.5505,
  longitude: -46.6333,
  breed: 'Labrador',
  color: 'Amarelo',
  size: 'grande',
  status: 'encontrado',
  userId: mockUser.id,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const mockUserWithoutPassword = {
  id: mockUser.id,
  email: mockUser.email,
  name: mockUser.name,
  avatar: mockUser.avatar,
  createdAt: mockUser.createdAt,
};

export const mockDogWithUser = {
  ...mockDog,
  user: {
    id: mockUser.id,
    name: mockUser.name,
    email: mockUser.email,
  },
};

export const mockJwtToken = 'mock.jwt.token.here';
export const mockJwtSecret = 'test_secret';
