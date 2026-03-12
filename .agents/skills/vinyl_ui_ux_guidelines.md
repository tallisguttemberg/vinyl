---
name: vinyl_ui_ux_guidelines
description: Regras estilísticas e regras visuais de Tailwind CSS e UI para criar interfaces com ar premium, esteticamente sofisticado e responsivo no projeto Vinyl.
---

# Vinyl - UI/UX & Style Guide 

A estética visual da aplicação Vinyl deve **obrigatoriamente** refletir um produto altamente premium, focado na experiência do usuário (UX) com respostas interativas visíveis. Seus designs e construções não devem parecer com versões simples e padronizadas (Bootstrap/V1), mas sim, com startups inovadoras usando Glassmorphism, Bordas Suaves e Sombreamentos Ricos.

Siga sempre as seguintes direções:

## 1. Topografia e Espaçamentos

- **Espaçamento Uniforme**:
  O uso de `space-y-4` ou `space-y-6` na classe de div contenedoras é obrigatório para não sujar o markup interno com padding e margens bagunçadas.
  
- **Tamanhos e Bordas Arredondadas**:
  Use `rounded-md`, `rounded-lg` ou `rounded-xl`. Componentes primários de layout e listagens de tabela nunca devem ter bordas quadradas agressivas. (Procure focar em `rounded-md` como estilo de botão nativo e `xl` para paineis de cartões Dashboard, por exemplo).
  
- **Títulos (Typography)**:
  Títulos (H2 de página, etc) devem ter `font-bold` e preferencialmente conter `tracking-tight` (letter-spacing levemente comprimido). Exemplo: `className="text-3xl font-bold tracking-tight"`.

## 2. Paleta de Cores Tailwind 

O sistema possui cores de `shadcn/ui` definidas na layer `base` no `globals.css` (Background, Card, Muted, Primary, Destructive, etc). Sempre busque usá-las para suportar dark/light modes.
Porém, quando usar acentos nativos (exemplo: Ícones que representam Módulos ou Botões Críticos):
  - **Indigo/Violet**: Ótimo para branding (Ex: Sidebar e botões de primários customizados).
  - **Sky/Emerald/Orange/Pink**: Recomendados para destacar ícones de rotas, como por ex., a cor de hover na Sidebar, ou Badges de Status. 

## 3. Sombras, Efeitos de Elevação (Glassmorphism e Micro-animações)

Sempre tente encorajar interações adicionando micro-animações, como em classes que definem botões principais e cards, especialmente elementos interativos.

**Tabelas e Cards**:
Nas exibições de dados em cards, use sombreamentos atraentes: `shadow-md` ou `shadow-[0_0_10px_rgba(...,...)]` em vez da sombra simples padrão. O `border` deve ser mantido discreto: `border bg-card shadow`.

**Transições**:
As tags contendo botões redondos (`rounded-full`), botões fantasmas (`variant="ghost"`) e menus expansíveis (Sidebar menu item) exigem a propriedade `transition` ou `transition-all duration-300`. Se o botão ganha destaque ou um scale, use `hover:scale-105` (junto ao transition respectivo).

**Exemplo Estiloso Premium (Toggle Lateral):**
```html
<button className="bg-indigo-600 rounded-full flex items-center justify-center hover:bg-indigo-500 transition-all duration-300 shadow-[0_0_10px_rgba(79,70,229,0.4)] group">
    <Icon className="text-white group-hover:scale-110 transition-transform" />
</button>
```
Notem que criamos um `group` no parent para afetar o SVG `group-hover:scale-110`. Isso traz um ar super fluido e profissional.

## 4. UI em Estágios Neutros (Carregamento / Empty States)

Não use `<div />` crus e textos soltos para definir quando algo não está pronto.

- **Carregamento**: Se uma lista não for carregada, coloque isso estruturalmente preenchido. Preferir um Card preenchido, Skeleton ou mesmo um `<tr>` mesclado centralizando o texto `Carregando...` na Tabela do componente.
- **Empty States**: Mostre centralizado: `<TableCell colSpan={7} className="text-center">Nenhum registro encontrado.</TableCell>`.

## 5. Indicadores de Status

Ao exibir status nos Grids/Dashboards, use formatações com cor explícita. Evite apenas escrever "Pago" ou "Pendente":
- Use cores: `<span className="text-orange-500">Pendente</span>`
- Em casos alarmantes: `<span className="text-red-500 font-bold">Atrasado</span>` ou com fundo ressaltado global: `<span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full text-xs text-muted-foreground" />`

Cumpra essas specs. Elas manterão a elegância do software no máximo detalhe de execução diária.
