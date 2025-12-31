export class OverlayManager {
    constructor() {
        this.element = null;
        this.template = "modules/foundry-module/templates/overlay.hbs";
    }

    /**
     * Inicializa o OverlayManager
     */
    init() {
        console.log("Foundry Module | Initializing OverlayManager");
        
        // Usamos o hook 'ready' para garantir que o jogo esteja totalmente carregado
        Hooks.once('ready', this._onReady.bind(this));
    }

    async _onReady() {
        await this.renderOverlay();
        
        // Registra hooks para atualizações
        Hooks.on('controlToken', this._onControlToken.bind(this));
        Hooks.on('updateActor', this._onUpdateActor.bind(this));
        
        // Verifica se já existe um token selecionado
        if (canvas.tokens?.controlled.length > 0) {
            this.updateContent(canvas.tokens.controlled[0].actor);
        }
    }

    /**
     * Chamado quando um token é selecionado ou desselecionado
     */
    _onControlToken(token, controlled) {
        if (controlled) {
            this.updateContent(token.actor);
        } else {
            // Se não houver mais tokens selecionados, limpa ou mostra o último?
            // Por enquanto, se nenhum estiver selecionado, limpa.
            if (canvas.tokens.controlled.length === 0) {
                this.clearContent();
            } else {
                // Se ainda houver tokens (seleção múltipla), mostra o primeiro
                this.updateContent(canvas.tokens.controlled[0].actor);
            }
        }
    }

    /**
     * Chamado quando um ator é atualizado (HP, nome, etc)
     */
    _onUpdateActor(actor, updateData) {
        // Só atualiza se o ator modificado for o que estamos mostrando
        const currentToken = canvas.tokens.controlled[0];
        if (currentToken && currentToken.actor.id === actor.id) {
            this.updateContent(actor);
        }
    }

    /**
     * Atualiza o conteúdo do DOM com os dados do ator
     */
    updateContent(actor) {
        if (!this.element || !actor) return;

        const name = actor.name;
        const hp = actor.system.attributes?.hp;
        const ac = actor.system.attributes?.ac;

        // Atualiza textos
        this.element.find('#hud-actor-name').text(name);
        
        if (hp) {
            this.element.find('#hud-actor-hp').text(`${hp.value}/${hp.max}`);
        }
        
        if (ac) {
            this.element.find('#hud-actor-ac').text(ac.value || 0);
        }

        // Alterna visibilidade
        this.element.find('#hud-no-selection').addClass('hidden');
        this.element.find('#hud-actor-info').removeClass('hidden');
    }

    /**
     * Limpa a HUD quando nada está selecionado
     */
    clearContent() {
        if (!this.element) return;
        
        this.element.find('#hud-no-selection').removeClass('hidden');
        this.element.find('#hud-actor-info').addClass('hidden');
    }

    /**
     * Renderiza o template e o injeta no DOM
     */
    async renderOverlay() {
        if (this.element) return;

        try {
            // Renderiza o template Handlebars
            const htmlContent = await renderTemplate(this.template, {});
            
            // Cria o elemento jQuery
            this.element = $(htmlContent);
            
            // Injeta no body do documento
            $('body').append(this.element);
            
            console.log("Foundry Module | Overlay injected");
        } catch (err) {
            console.error("Foundry Module | Failed to render overlay:", err);
        }
    }
}
