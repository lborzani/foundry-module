# Instruções do Projeto: Foundry VTT UI Module

## Contexto
Estamos desenvolvendo um módulo para Foundry VTT (v12+) focado em adicionar elementos gráficos personalizados à interface (HUD/Overlay). O projeto deve seguir padrões modernos de desenvolvimento JavaScript.

## Padrões de Código
1.  **JavaScript:** Use ES Modules (`.mjs`). Evite `var`, prefira `const` e `let`.
2.  **Classes:** Utilize Classes para encapsular lógica (ex: `HudManager`, `ActorService`).
3.  **Foundry API:**
    - Use a API v12+ (ex: `foundry.applications.api.ApplicationV2` se aplicável).
    - Prefira `Hooks.on` para eventos.
    - Use `game.i18n.localize` para todos os textos visíveis.
4.  **Estilização:**
    - Use variáveis CSS (`var(--my-module-color)`) para facilitar temas.
    - Prefira Flexbox e Grid para layouts.
    - Namespacing em classes CSS para evitar conflitos (ex: `.my-mod-container`).

## Estrutura de Arquivos Preferida
- `src/`: Código fonte.
  - `apps/`: Classes de Aplicação/UI.
  - `scripts/`: Lógica de negócios e Hooks.
  - `styles/`: Arquivos CSS/SCSS.
  - `templates/`: Arquivos HTML/Handlebars.

## Comportamento Específico
- Ao sugerir código, verifique se ele precisa ser registrado no `Hooks.once('init')` ou `Hooks.once('ready')`.
- Se criar HTML, sugira também o CSS correspondente para que o elemento seja visível.
- Mantenha a compatibilidade com o sistema `dnd5e` como prioridade, mas tente manter o código agnóstico quando possível.
