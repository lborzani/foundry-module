import { RuneManager } from './RuneManager.mjs';
import { RUNES } from './constants.mjs';
import '../styles/module.css';

Hooks.once('init', async () => {
    console.log('Foundry Module | Initializing module');
    
    // Expõe o RuneManager globalmente
    game.modules.get('foundry-module').api = {
        RuneManager
    };

    // Preload templates
    loadTemplates(['modules/foundry-module/templates/rune-tab.hbs']);
});

Hooks.on('renderActorSheet', async (app, html, data) => {
    const actor = app.actor;
    if (!actor) return;

    // Prepara os dados para o template
    const runeData = {
        ether: RuneManager.getEther(actor),
        runes: {}
    };

    // Popula as categorias com status de conhecido
    for (const [key, category] of Object.entries(RUNES)) {
        const known = RuneManager.getKnownRunes(actor, category.id);
        runeData.runes[key] = {
            ...category,
            items: category.items.map(item => ({
                ...item,
                known: known.includes(item.id)
            }))
        };
    }

    // Renderiza o template
    const content = await renderTemplate('modules/foundry-module/templates/rune-tab.hbs', runeData);

    // Injeta a aba na navegação
    let tabs = html.find('.sheet-tabs');
    if (tabs.length === 0) {
        // Tenta outros seletores comuns
        tabs = html.find('nav.tabs'); 
    }

    if (tabs.length > 0) {
        // Adiciona o botão da aba
        const tabBtn = $(`<a class="item" data-tab="runes">Runas</a>`);
        tabs.append(tabBtn);

        // Adiciona o conteúdo da aba
        const sheetBody = html.find('.sheet-body');
        sheetBody.append(content);

        // Reativa os listeners de abas do Foundry para incluir a nova aba
        if (app._tabs && app._tabs.length > 0) {
            app._tabs[0].bind(html[0]);
        }
    } else {
        console.warn('Foundry Module | Could not find sheet tabs to inject Rune tab.');
    }

    // Listeners da aba de runas
    html.find('.rune-tab input[name="flags.foundry-module.ether"]').on('change', async (ev) => {
        const value = parseInt(ev.target.value);
        await RuneManager.setEther(actor, value);
    });

    html.find('.rune-control[data-action="toggle-rune"]').on('click', async (ev) => {
        const item = $(ev.currentTarget).closest('.rune-item');
        const runeId = item.data('rune-id');
        const categoryKey = item.data('category');
        
        // Mapeia a chave da categoria (VERBS, NOUNS, SOURCE) para o ID (verbs, nouns, source)
        const categoryId = RUNES[categoryKey].id;

        await RuneManager.toggleRune(actor, categoryId, runeId);
        
        // Re-renderiza a aba (ou a ficha toda) para atualizar ícones
        app.render(false); 
    });
});

