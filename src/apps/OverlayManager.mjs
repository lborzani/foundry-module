import { RuneManager } from '../scripts/RuneManager.mjs';

export class OverlayManager {
    constructor() {
        this.element = null;
        this.template = "modules/foundry-module/templates/overlay.hbs";
        this.currentActor = null;
    }

    /**
     * Inicializa o OverlayManager
     */
    init() {
        console.log("Foundry Module | Initializing OverlayManager");

        // Registra configurações
        game.settings.register("foundry-module", "overlayPosition", {
            scope: "client",
            config: false,
            type: Object,
            default: { top: 100, left: 100 }
        });

        game.settings.register("foundry-module", "overlayLocked", {
            scope: "client",
            config: false,
            type: Boolean,
            default: false
        });
        
        // Usamos o hook 'ready' para garantir que o jogo esteja totalmente carregado
        Hooks.once('ready', this._onReady.bind(this));
    }

    async _onReady() {
        await this.renderOverlay();
        
        // Registra hooks para atualizações
        Hooks.on('controlToken', this._onControlToken.bind(this));
        Hooks.on('updateActor', this._onUpdateActor.bind(this));
        Hooks.on('updateRuneMaker', this._onUpdateRuneMaker.bind(this));
        
        // Verifica se já existe um token selecionado
        if (canvas.tokens?.controlled.length > 0) {
            this.updateContent(canvas.tokens.controlled[0].actor);
        }
    }

    _onUpdateRuneMaker(actor) {
        // Se o ator atualizado for o que estamos vendo, atualiza a UI
        if (this.currentActor && this.currentActor.id === actor.id) {
            this.updateContent(actor);
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
        
        this.currentActor = actor;

        const name = actor.name;
        const hp = actor.system.attributes?.hp;
        const ac = actor.system.attributes?.ac;

        // Dados do Rune Maker
        const ether = RuneManager.getEther(actor);
        const maxEther = RuneManager.getECMax(actor);
        const etherPercent = maxEther > 0 ? Math.min(100, (ether / maxEther) * 100) : 0;

        // Atualiza textos
        this.element.find('#hud-actor-name').text(name);
        
        if (hp) {
            this.element.find('#hud-actor-hp').text(`${hp.value}/${hp.max}`);
        }
        
        if (ac) {
            this.element.find('#hud-actor-ac').text(ac.value || 0);
        }

        // Atualiza Ether Bar
        this.element.find('#hud-ether-text').text(`${ether} / ${maxEther}`);
        const bar = this.element.find('#hud-ether-bar');
        bar.css('width', `${etherPercent}%`);
        
        // Visual de Sobrecarga
        if (ether > maxEther) {
            bar.addClass('overload');
        } else {
            bar.removeClass('overload');
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
        this.currentActor = null;
        
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
            
            // Aplica posição salva
            const pos = game.settings.get("foundry-module", "overlayPosition");
            this.element.css({ top: pos.top, left: pos.left, right: 'auto' }); // Remove right default

            // Aplica estado de lock inicial
            const locked = game.settings.get("foundry-module", "overlayLocked");
            this._updateLockState(locked);

            // Injeta no body do documento
            $('body').append(this.element);
            
            // Ativa listeners
            this._activateListeners();

            console.log("Foundry Module | Overlay injected");
        } catch (err) {
            console.error("Foundry Module | Failed to render overlay:", err);
        }
    }

    _activateListeners() {
        const header = this.element.find('.hud-header');
        const lockBtn = this.element.find('.hud-lock');
        const purgeBtn = this.element.find('#hud-btn-purge');
        
        // Purge Button
        purgeBtn.click(async (ev) => {
            ev.preventDefault();
            if (this.currentActor) {
                await RuneManager.purgeCache(this.currentActor);
            }
        });

        // Toggle Lock
        lockBtn.click(async (ev) => {
            ev.preventDefault();
            const isLocked = game.settings.get("foundry-module", "overlayLocked");
            await game.settings.set("foundry-module", "overlayLocked", !isLocked);
            this._updateLockState(!isLocked);
        });

        // Dragging Logic
        let isDragging = false;
        let offset = { x: 0, y: 0 };

        header.mousedown((ev) => {
            if (game.settings.get("foundry-module", "overlayLocked")) return;
            if (ev.target.closest('.hud-lock')) return; // Ignora clique no cadeado

            isDragging = true;
            const rect = this.element[0].getBoundingClientRect();
            offset.x = ev.clientX - rect.left;
            offset.y = ev.clientY - rect.top;
            
            this.element.addClass('dragging');
        });

        $(document).mousemove((ev) => {
            if (!isDragging) return;
            
            const top = ev.clientY - offset.y;
            const left = ev.clientX - offset.x;
            
            this.element.css({ top, left });
        });

        $(document).mouseup(async (ev) => {
            if (!isDragging) return;
            isDragging = false;
            this.element.removeClass('dragging');
            
            // Salva nova posição
            const rect = this.element[0].getBoundingClientRect();
            await game.settings.set("foundry-module", "overlayPosition", {
                top: rect.top,
                left: rect.left
            });
        });
    }

    _updateLockState(locked) {
        const icon = this.element.find('.hud-lock i');
        const header = this.element.find('.hud-header');

        if (locked) {
            icon.removeClass('fa-lock-open').addClass('fa-lock');
            header.addClass('locked');
        } else {
            icon.removeClass('fa-lock').addClass('fa-lock-open');
            header.removeClass('locked');
        }
    }
}
