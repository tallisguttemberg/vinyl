# Padrão de Filtros Globais do Sistema

## 1. Introdução
Esta especificação define o padrão visual e de comportamento para a área de filtros (`"Limpar Filtros"`, Busca de Datas, Selects) em todos os módulos e tabelas da aplicação Vinyl. Este padrão foi originado e implementado primariamente no módulo **Financeiro** (`financial/page.tsx`) e copiado para o **Dashboard**.

## 2. Padrão Estrutural (Layout)

Sempre que existirem múltiplos campos de filtragem (ex: Selects para Status, Inputs de Data Mínima/Máxima), o encapsulamento principal deve ser uma `div` com as seguintes classes Tailwind e recursos visuais:

```tsx
<div className="flex flex-wrap items-center gap-4 bg-muted/40 p-5 rounded-2xl border border-border/50">
    {/* CONTEÚDO DOS FILTROS */}
</div>
```

**Por que este layout?**
- `bg-muted/40` e `border-border/50` dão um acabamento suave com a paleta de cores.
- `rounded-2xl` respeita o "premium look" adotado pelo sistema.
- `flex-wrap items-center gap-4` garante que eles quebrem de linha harmoniosamente no responsivo (mobile).

## 3. Padrão de Campos de Entrada Form (Inputs, Selects)
Cada filtro individual deve conter o seguinte bloco. O *Label* é sempre `text-xs font-bold uppercase tracking-widest pl-1` com letras discretas e modernas.

### 3.1 Exemplo: Input de Data
```tsx
<div className="flex flex-col gap-1.5 min-w-[140px]">
    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Data Mínima</label>
    <input 
        type="date" 
        className="flex h-10 w-full rounded-xl border border-border/40 bg-background/80 px-3 py-2 text-sm backdrop-blur placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-all dark:bg-background/40"
        value={startDate} 
        onChange={(e) => setStartDate(e.target.value)} 
    />
</div>
```

### 3.2 Exemplo: Selects (Status, Categorias)
```tsx
<div className="flex flex-col gap-1.5 min-w-[180px]">
    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Status</label>
    <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="bg-background/80 backdrop-blur rounded-xl border-border/40">
            <SelectValue placeholder="Todos" />
        </SelectTrigger>
        <SelectContent>
            {/* Itens */}
        </SelectContent>
    </Select>
</div>
```

## 4. O Botão "Limpar Filtros"
O botão "Limpar Filtros" deve manter-se encostado no final da linha ou ser naturalmente o último item renderizado no contêiner quando ativado. Ele só deve ser renderizado (`&&`) se houver ativamente algum filtro que difere do padrão.

No meio do botão e os campos, pode ser incluída a tag `<div className="flex-1" />` para jogar o botão de Limpar sempre pra direita se tiver espaço.

### Código do Botão:
```tsx
<div className="flex-1" /> {/* Spacer */}

{hasActiveFilters && (
    <Button 
        variant="ghost" 
        size="sm" 
        className="h-10 px-4 rounded-xl text-xs font-bold uppercase hover:bg-background/50 text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-colors"
        onClick={clearAllFilters}
    >
        <X className="mr-2 h-4 w-4" /> Limpar Filtros
    </Button>
)}
```

## 5. Regras de Comportamento e Funcionalidade
1. **Ativação Sensível**: O botão "Limpar Filtros" APENAS DEVE APARECER se pelo menos UM filtro estiver preenchido com um valor diferente do Default (ex: Quando `startDate` ou `endDate` possuem algum valor ou Select for diferente de `"ALL"`).
2. **Iconografia Limpa**: Sempre use `<X />` do pacote `lucide-react` para o clique, ou invés de `"Limpar"`.
3. **Restabelecimento**: Ao disparar o botão `onClick`, todos os estados de filtragem devem obrigatoriamente retornar a suas origens, e componentes pautados em paginação (ex: `page`) com fetch devem rodar `setPage(1)`.
4. **Fuso-horário (UTC/Brasil) nos Dados Opcionais**: Para buscas em `date`, opte por adicionar strings corretivas de início e fim no backend, convertendo a prop opcional string de YYYY-MM-DD para ISO adicionando `T00:00:00-03:00` na start date e `T23:59:59-03:00` na end date.
