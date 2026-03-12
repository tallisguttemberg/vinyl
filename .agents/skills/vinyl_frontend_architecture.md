---
name: vinyl_frontend_architecture
description: Regras arquiteturais obrigatórias para criar Single Page Applications dinâmicas dentro do framework App Router (Next.js), integrando tRPC e formulários usando Zod + Shadcn.
---

# Vinyl - Padrões de Arquitetura de Frontend (Next.js + tRPC + Tailwind + Shadcn)

O frontend do Vinyl é construído visando robustez, forte tipagem, e extrema facilidade na manutenção, garantindo previsibilidade de componentes através da utilização do **shadcn/ui**.

## 1. Estrutura e Organização de Pastas

1. `frontend/src/app/(dashboard)/`: Agrupa todas as rotas de usuários logados (que contém Sidebar, Header e exigem autenticação). Páginas como `materials/page.tsx`, `orders/page.tsx` ficam sempre neste esquema.
2. `frontend/src/components/`:
   - `ui/`: Exclusivo para componentes criados e expostos pelo shadcn (ex: `Button.tsx`, `Dialog.tsx`, `Select.tsx`, etc). Não os edite diretamente (a não ser por tokens de estilo global).
   - Pastas baseadas em Domínio (ex: `materials`, `financial`): Exclusivas para componentes de reuso dessas telas. (ex. `MaterialForm.tsx`).

## 2. Padrões de Componentes de Página (`page.tsx`)

Sempre siga a seguinte arquitetura básica ao criar novas páginas dinâmicas (CRUD):

- **Hooks e Autorização**:
  Utilize sempre o hook customizado `usePermission()` para definir se o componente renderiza o grid, se renderiza os botões ou bloqueia o usuário com uma tela "Acesso Negado".
  ```tsx
  const { hasPermission, isLoading: loadingPerms } = usePermission();
  if (!loadingPerms && !hasPermission("meuModulo", "visualizar")) return <AcessoNegado />;
  ```
- **tRPC e Queries**:
  Não use `fetch` direto. Busque toda sua informação atrelada à permissão usando a API.
  ```tsx
  const { data: itens, isLoading } = api.meuModulo.getAll.useQuery(undefined, {
      enabled: !loadingPerms && hasPermission("meuModulo", "visualizar"),
  });
  ```
- **Modais para Criação e Edição (Dialog)**:
  Sempre utilize os fluxos assíncronos via Modais para inserções e edições, não crie páginas extras de rotas novas desnecessariamente (`app/meu-modulo/new/page.tsx` ❌ - errado).
  Use o componente `Dialog` e variáveis de state locais controlando sua abertura:
  ```tsx
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  ```
- **Exclusões**:
  Sempre intercepte chamadas de `delete` usando um simples `window.confirm`. Se tiver botões ou listagem, não os exiba caso o usuário não tenha o `hasPermission("modulo", "excluir")`.
- **Anulação de Cache (Invalidation)**:
  A cada operação mutável criada (create, update, delete), utilize `utils.meuModulo.getAll.invalidate()` do obj global `api.useUtils()`. 

## 3. Padrículas Universais para Formulários (`useForm` / `Zod`)

As rotinas de *submit* em Formulários sempre seguem a trindade **Shadcn `Form` + `react-hook-form` + `zod`**. Não crie formulários de HTML puro nem use refs manuais.

**Como criar um form:**

1. **Defina o schema `Zod` exportável do componente** para compartilhar as tipagens:
   ```tsx
   export const formSchema = z.object({ /* rules */ });
   export type ModuloFormValues = z.infer<typeof formSchema>;
   ```
2. **Componente Recebendo Props Curingas**:
   Defina o componente para atuar tanto na criação quanto edição via prop externa `initialValues`.
   ```tsx
   interface MeuFormProps {
       initialValues?: ModuloFormValues;
       onSubmit: (values: ModuloFormValues) => void;
       isPending: boolean;
   }
   ```
3. **Mapeamento Genérico do Hook**:
   *Cuidado Crítico com Numbers e Datas no tRPC vs inputs do Frontend.* Se usar campos tipo Number, adicione `.coerce.number()` no seu schema *Zod* caso os fields no frontend usem `type="number"`. Em caso contínuo de erros tipográficos complexos como em formulários Zod instáveis internamente (generics error TS), converta o `zodResolver(formSchema) as any` e trate os parsings de saída se necessário dentro da sua func formater.

## 4. Ícones / Bibliotecas

Sempre busque usar componentes SVG nativos.
Para ícones padrão, utilizar unicamente a importação do `lucide-react`.

## 5. Resumo Global
Ao mexer no frontend: Autentique visualmente os botões (apenas dê bind nas funções se a tela mostrar o botão; se a tela não mostrar, não os faça soláveis), traga modais e invalide ativamente o trpc para telas responsivas.
