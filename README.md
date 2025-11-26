# 🐶 Dog Spotter API

API REST para aplicação Dog Spotter - sistema de registro e localização de cachorros encontrados ou perdidos.

## 📋 Sobre o Projeto

Dog Spotter é uma API desenvolvida em Node.js/TypeScript que permite aos usuários registrar, buscar e gerenciar informações sobre cachorros encontrados ou perdidos. O sistema utiliza autenticação JWT e armazenamento de imagens para facilitar a identificação e reunião de pets com seus donos.

## 🚀 Tecnologias

- **Node.js** - Ambiente de execução JavaScript
- **TypeScript** - Superset JavaScript com tipagem estática
- **Express** - Framework web minimalista
- **Prisma** - ORM para banco de dados
- **PostgreSQL** - Banco de dados relacional
- **JWT** - Autenticação baseada em tokens
- **Bcrypt** - Hash de senhas
- **Multer** - Upload de arquivos
- **Azure Blob Storage** - Armazenamento de imagens
- **Docker** - Containerização

## 📁 Estrutura do Projeto

```
backend/
├── src/
│   ├── config/          # Configurações (database, etc)
│   ├── middleware/      # Middlewares (autenticação, etc)
│   ├── routes/          # Rotas da API
│   ├── services/        # Lógica de negócio
│   ├── types/           # Definições de tipos TypeScript
│   └── index.ts         # Arquivo principal
├── prisma/
│   ├── schema.prisma    # Schema do banco de dados
│   └── schema.sql       # SQL complementar
├── uploads/             # Diretório para arquivos enviados
├── Dockerfile           # Configuração Docker
├── package.json         # Dependências do projeto
└── tsconfig.json        # Configuração TypeScript
```

## 🛠️ Instalação e Configuração

### Pré-requisitos

- Node.js 20.x ou superior
- PostgreSQL 14 ou superior
- npm ou yarn

### Passo a Passo

1. **Clone o repositório**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**
   
   Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo:
   
   ```env
   # Database
   DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/dogspotter?sslmode=prefer"
   
   # Server
   PORT=3000
   NODE_ENV=development
   
   # JWT
   JWT_SECRET=dogspotter_jwt_secret_key_change_in_production_2024
   
   # CORS
   CORS_ORIGIN=*
   
   # Azure Blob Storage
   AZURE_STORAGE_CONNECTION_STRING=mock_connection_string
   AZURE_STORAGE_CONTAINER_NAME=dog-images
   ```

4. **Configure o banco de dados**
   ```bash
   npm run prisma:generate
   npm run prisma:push
   ```

5. **Inicie o servidor de desenvolvimento**
   ```bash
   npm run dev
   ```

   O servidor estará disponível em `http://localhost:3000`

### Setup Rápido

Para instalação completa em um único comando:
```bash
npm run setup
```

## 🐳 Docker

### Build da imagem
```bash
docker build -t dog-spotter-api .
```

### Executar container
```bash
docker run -p 3000:3000 --env-file .env dog-spotter-api
```

## 📚 Endpoints da API

### Autenticação

- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Login de usuário
- `GET /api/auth/me` - Obter dados do usuário autenticado

### Usuários

- `GET /api/users/:id` - Obter usuário por ID
- `PUT /api/users/:id` - Atualizar usuário
- `DELETE /api/users/:id` - Deletar usuário

### Cachorros

- `GET /api/dogs` - Listar todos os cachorros
- `GET /api/dogs/:id` - Obter cachorro por ID
- `POST /api/dogs` - Registrar novo cachorro
- `PUT /api/dogs/:id` - Atualizar cachorro
- `DELETE /api/dogs/:id` - Deletar cachorro

### Upload

- `POST /api/upload` - Upload de imagem

### Health Check

- `GET /health` - Verificar status da API

## 🔑 Autenticação

A API utiliza autenticação JWT (JSON Web Token). Para acessar rotas protegidas, inclua o token no header:

```
Authorization: Bearer <seu-token-jwt>
```

## 💾 Modelo de Dados

### User
- `id`: UUID
- `email`: String (único)
- `password`: String (hash)
- `name`: String (opcional)
- `avatar`: String (opcional)
- `createdAt`: DateTime
- `updatedAt`: DateTime

### Dog
- `id`: UUID
- `description`: String
- `imageUrl`: String (opcional)
- `latitude`: Float
- `longitude`: Float
- `breed`: String (opcional)
- `color`: String (opcional)
- `size`: String (pequeno, médio, grande)
- `status`: String (encontrado, perdido, adotado)
- `userId`: String (FK)
- `createdAt`: DateTime
- `updatedAt`: DateTime

## 📝 Scripts Disponíveis

```bash
npm run dev              # Inicia servidor de desenvolvimento
npm run build            # Compila TypeScript para JavaScript
npm start                # Inicia servidor em produção
npm run prisma:generate  # Gera Prisma Client
npm run prisma:migrate   # Executa migrations
npm run prisma:push      # Push schema para banco de dados
npm run prisma:studio    # Abre Prisma Studio
npm run setup            # Setup completo do projeto
```

## 🧪 Testando a API

Utilize o arquivo `test.http` incluído no projeto para testar os endpoints. Recomenda-se usar a extensão REST Client do VS Code.

## 🚀 Deploy

### Azure

Consulte o arquivo `azure-deploy.md` para instruções detalhadas de deploy na Azure.

## 🔒 Segurança

- Senhas são hasheadas usando bcrypt
- Autenticação JWT com expiração configurável
- CORS configurável por ambiente
- Validação de entrada em todos os endpoints
- Em produção, sempre altere o `JWT_SECRET`

## 🤝 Contribuindo

1. Faça fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.

## 👥 Autor

Desenvolvido por candago-5

## 📞 Suporte

Para questões e suporte, abra uma issue no repositório do GitHub.
