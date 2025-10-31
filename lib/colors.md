# Sistema de Cores da Aplicação

## ⚠️ REGRAS FUNDAMENTAIS

### 1. Sistema de Cores

**NUNCA use cores hardcoded no código (hex, rgb, hsl diretos).**
**SEMPRE use as classes Tailwind com variáveis CSS definidas em `app/globals.css`.**

### 2. Modificações no `app/globals.css`

**⚠️ NÃO adicione estilos customizados em `app/globals.css` a menos que seja ABSOLUTAMENTE NECESSÁRIO.**

Este arquivo deve conter APENAS:
- Diretivas do Tailwind (`@tailwind`, `@layer`)
- Definições de variáveis CSS do tema (`:root` e `.dark`)
- Estilos base essenciais (body, * com border-border)

**Para estilos customizados:**
- ✅ Crie arquivos CSS separados (ex: `components/meu-componente.module.css`)
- ✅ Use classes Tailwind diretamente nos componentes
- ✅ Use os componentes do Shadcn UI (já estilizados com o tema)
- ✅ Use a função `cn()` para combinar classes Tailwind

**❌ NÃO faça:**
- ❌ Adicionar estilos customizados diretamente no `globals.css`
- ❌ Criar classes CSS personalizadas no `globals.css`
- ❌ Adicionar media queries ou estilos específicos no `globals.css`

## Como Usar Cores

### ✅ CORRETO - Use classes Tailwind com variáveis do tema:

```tsx
// Backgrounds
<div className="bg-background">       // Cor de fundo principal
<div className="bg-card">            // Cor de fundo de cards
<div className="bg-primary">         // Cor primária
<div className="bg-secondary">      // Cor secundária
<div className="bg-muted">          // Cor muted
<div className="bg-accent">         // Cor de destaque

// Textos
<p className="text-foreground">           // Texto principal
<p className="text-primary-foreground">   // Texto sobre primary
<p className="text-secondary-foreground"> // Texto sobre secondary
<p className="text-muted-foreground">      // Texto muted

// Bordas
<div className="border-border">  // Borda padrão
<div className="border-input">   // Borda de inputs
<div className="border-ring">    // Borda de foco
```

### ❌ INCORRETO - NUNCA faça isso:

```tsx
// ❌ NÃO USE cores hardcoded
<div className="bg-[#6c5ce7]">
<div style={{ backgroundColor: "#f9f9f9" }}>
<div className="text-blue-500">
```

## Variáveis Disponíveis

Todas as variáveis estão definidas em `app/globals.css`:

### Cores Principais
- `--background`: Fundo principal
- `--foreground`: Texto principal
- `--primary`: Cor primária
- `--secondary`: Cor secundária
- `--muted`: Cor muted
- `--accent`: Cor de destaque
- `--destructive`: Cor de erro/destrutiva

### Cores de Componentes
- `--card`: Fundo de cards
- `--popover`: Fundo de popovers
- `--border`: Cor de bordas
- `--input`: Cor de borda de inputs
- `--ring`: Cor de anel de foco

### Cores de Sidebar
- `--sidebar`: Fundo da sidebar
- `--sidebar-foreground`: Texto da sidebar
- `--sidebar-primary`: Primary da sidebar
- `--sidebar-accent`: Accent da sidebar

### Cores de Gráficos
- `--chart-1` até `--chart-5`: Cores para gráficos

## Temas

O sistema suporta dois temas definidos em `globals.css`:
- **Light**: Definido em `:root`
- **Dark**: Definido em `.dark`

O tema é gerenciado pelo `ThemeProvider` e pode ser alternado usando o `ThemeToggle`.

## Exemplo de Componente Correto

```tsx
export function MeuComponente() {
  return (
    <div className="bg-card text-card-foreground border-border rounded-lg p-4">
      <h2 className="text-foreground font-semibold">Título</h2>
      <p className="text-muted-foreground">Descrição</p>
      <button className="bg-primary text-primary-foreground hover:bg-primary/90">
        Ação
      </button>
    </div>
  )
}
```



SEMPRE USE /components/ui (shadcn)