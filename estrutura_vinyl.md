# Estrutura do Projeto Vinyl

Abaixo está a estrutura principal de pastas e arquivos do projeto **Vinyl**:

```text
vinyl/
├── backend/                # Backend da aplicação (Node.js/Express/tRPC)
│   ├── prisma/             # Configurações e esquemas do Prisma ORM
│   ├── src/
│   │   ├── lib/            # Bibliotecas auxiliares e utilitários
│   │   ├── server/
│   │   │   └── api/        # Definições de roteadores tRPC e lógica de API
│   │   └── server.ts       # Ponto de entrada do servidor backend
│   ├── Dockerfile          # Configuração Docker para o backend
│   ├── package.json        # Dependências do backend
│   └── tsconfig.json       # Configuração do TypeScript para o backend
├── frontend/               # Frontend da aplicação (Next.js)
│   ├── public/             # Arquivos públicos e estáticos
│   ├── src/
│   │   ├── app/            # Estrutura de rotas (App Router)
│   │   │   ├── (dashboard)/# Telas internas do dashboard
│   │   │   ├── api/        # Endpoints de API do Next.js
│   │   │   ├── login/      # Tela de login
│   │   │   ├── layout.tsx  # Layout principal
│   │   │   └── globals.css # Estilos globais
│   │   ├── components/     # Componentes React reutilizáveis
│   │   │   ├── layout/     # Componentes de layout (Sidebar, Navbar)
│   │   │   ├── ui/         # Componentes de interface (shadcn/ui)
│   │   │   ├── users/      # Componentes relacionados a usuários
│   │   │   └── materials/  # Componentes relacionados a materiais
│   │   ├── lib/            # Utilitários e configurações (ex: utils de estilo)
│   │   ├── trpc/           # Configuração do cliente tRPC
│   │   └── middleware.ts   # Middleware do Next.js (Autenticação/Redirecionamento)
│   ├── Dockerfile          # Configuração Docker para o frontend
│   ├── next.config.ts      # Configuração do Next.js
│   ├── package.json        # Dependências do frontend
│   └── tsconfig.json       # Configuração do TypeScript para o frontend
├── database-data/          # Dados persistentes do banco de dados (local)
├── postgres-data/          # Dados persistentes do PostgreSQL (docker)
├── .dockerignore           # Arquivos ignorados pelo Docker
├── .gitignore              # Arquivos ignorados pelo Git
├── docker-compose.yml      # Configuração de orquestração de containers
├── package.json            # Link para dependências da raiz (se houver)
└── README.md               # Documentação geral do projeto
```

## Descrição dos Principais Diretórios

- **backend/**: Contém a lógica de negócio, acesso ao banco de dados via Prisma e a API tRPC.
- **frontend/**: Desenvolvido com Next.js, utiliza o App Router e componentes estilizados com Tailwind CSS e Radix UI (shadcn/ui).
- **prisma/**: Localizado dentro do backend, define o modelo de dados e migrações.
- **src/app/ (frontend)**: Define a navegação e as páginas da aplicação.
- **src/components/ (frontend)**: Organizado por funcionalidade para facilitar a manutenção.
