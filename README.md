<p align="center">
  <img src="https://readme-typing-svg.herokuapp.com?size=28&duration=4000&color=36BCF7&center=true&vCenter=true&width=600&lines=🐶+Dog+Spotter+;API+em+Nuvem+para+Localizar+C%C3%A3es;Candago+Building+Tech+" alt="Dog Spotter Backend banner">
</p>

---

![Repo Views](https://komarev.com/ghpvc/?username=candago-5&repo=backend&label=Views&color=blue&style=flat)
![GitHub top language](https://img.shields.io/github/languages/top/candago-5/backend?style=flat&color=green)
![GitHub last commit](https://img.shields.io/github/last-commit/candago-5/backend?color=yellow)


![TypeScript](https://img.shields.io/badge/-TypeScript-333333?style=flat&logo=typescript)
![Figma](https://img.shields.io/badge/-Figma-333333?style=flat&logo=figma)
![React](https://img.shields.io/badge/-React-333333?style=flat&logo=react)
![Python](https://img.shields.io/badge/-Python-333333?style=flat&logo=python)
![Node.js](https://img.shields.io/badge/-Node.js-333333?style=flat&logo=node.js)
![Docker](https://img.shields.io/badge/-Docker-333333?style=flat&logo=docker)
![Jest](https://img.shields.io/badge/-Jest-333333?style=flat&logo=jest)




---

## ✅ Pré‑requisitos
- Node.js 18+ e npm (ou pnpm/yarn)
- Uma base de dados disponível:
  - PostgreSQL 13+ (recomendado) ou
  - MongoDB 5+
- Opcional: Docker e Docker Compose

---

## 📂 Estrutura do projeto
- `src/` — código principal (rotas, controladores, etc.)
- `routes/` — definição das rotas HTTP
- `models/` — modelos de dados/ORM/ODM
- `controllers/` — lógica de negócio
- `tests/` — testes automatizados

Observação: alguns diretórios podem variar conforme a implementação real.

---

## ⚙️ Configuração de ambiente
1) Copie o arquivo de exemplo e ajuste as variáveis:

```powershell
Copy-Item .env.example .env
```

Variáveis importantes (ver `.env.example`):
- `PORT` — porta do servidor (padrão 3000)
- `NODE_ENV` — development | production | test
- `JWT_SECRET` — segredo para assinar tokens
- Para PostgreSQL: `DATABASE_URL=postgres://USER:PASS@HOST:5432/DB`
- Para MongoDB: `MONGO_URI=mongodb://USER:PASS@HOST:27017/DB`
- `CORS_ORIGIN` — origem permitida do frontend
- `ML_SERVICE_URL` — URL do serviço de ML (opcional)

---

## ▶️ Como rodar (sem Docker)
```powershell
# 1) Instale as dependências
npm install

# 2) (Opcional) configure o banco localmente
#    - PostgreSQL: crie o banco definido em DATABASE_URL
#    - MongoDB: crie a base definida em MONGO_URI
#    - Execute migrações/seed caso o projeto utilize (ex.: Prisma/Sequelize/Mongoose)

# 3) Suba a API em modo desenvolvimento
npm run dev

# 4) Acesse a saúde da API
# GET http://localhost:3000/health
```

---

## 🐳 Como rodar (com Docker)
Se existir um `docker-compose.yml` neste diretório, você pode tentar:

```powershell
docker compose up --build
```

Isso deve subir a API e o banco definidos no compose. Ajuste as variáveis do `.env` conforme necessário.

---

## 📘 API (visão geral)
- Autenticação: Bearer Token (JWT) via header `Authorization: Bearer <token>`
- Content-Type: `application/json`

Endpoints comuns (exemplo — ajuste conforme implementação real):
- `GET /health` → `{ "status": "ok" }`
- `POST /auth/login` → body `{ email, password }` → `{ token }`
- `GET /dogs` → lista cães
- `POST /dogs` → cria um cão (requer JWT)

Erros seguem o padrão:
```json
{ "error": { "code": "string", "message": "string" } }
```

---

## 🧪 Testes e qualidade
```powershell
# Executar testes (se configurado)
npm test

# Lint (se configurado)
npm run lint
```

---

## 🤝 Contribuição
1) Crie uma branch de feature: `git checkout -b feat/minha-feature`
2) Commit com mensagens claras
3) Abra um Pull Request descrevendo mudanças e passos de teste

---

##  Equipe
- 🤖 <kbd>Nome</kbd>: Guilherme Teixeira — PO | <kbd>GitHub</kbd>: [@GuilhermeCardoso0](https://github.com/Guilhermecardoso0)
- 👨‍💻 <kbd>Nome</kbd>: Caique Moura — SC | <kbd>GitHub</kbd>: [@caiquefrd](https://github.com/caiquefrd)
- 💻 <kbd>Nome</kbd>: Rafael Soares — Dev | <kbd>GitHub</kbd>: [@RafaelSM21](https://github.com/RafaelSM21)
- 💻 <kbd>Nome</kbd>: Luis Gustavo — Dev | <kbd>GitHub</kbd>: [@l-gustavo-barbosa](https://github.com/l-gustavo-barbosa)
- 💻 <kbd>Nome</kbd>: Lucas Jaques — Dev | <kbd>GitHub</kbd>: [@jaqueslucas](https://github.com/jaqueslucas)
- 💻 <kbd>Nome</kbd>: Lucas Assis — Dev | <kbd>GitHub</kbd>: [@Lucassis1](https://github.com/Lucassis1)

---

<p align="center">
  <img src="https://readme-typing-svg.herokuapp.com?size=24&duration=4000&color=FF5733&center=true&vCenter=true&width=500&lines=+Candago+Building+Tech+" alt="Team signature">
</p>
