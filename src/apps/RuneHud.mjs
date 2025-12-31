import { RuneManager } from '../scripts/RuneManager.mjs';

export class RuneHud extends Application {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "foundry-module-hud",
            template: "modules/foundry-module/templates/rune-hud.hbs",
            popOut: false,
        });
    }

    async getData() {
        const actor = canvas.tokens.controlled[0]?.actor || game.user.character;
        return {
            ether: actor ? RuneManager.getEther(actor) : 0,
            hasActor: !!actor
        };
    }

    async _render(force, options) {
        await super._render(force, options);
        // Garante que o elemento tenha a classe correta e esteja no body
        if (this.element) {
            this.element.addClass('foundry-module-overlay');
            if (this.element.parent().length === 0) {
                $('body').append(this.element);
            }
        }
    }

    activateListeners(html) {
        super.activateListeners(html);

        const header = html.find('.hud-header');
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        // Lógica simples de drag
        header.on('mousedown', (e) => {
            if (header.hasClass('locked')) return;
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            const el = this.element[0];
            const rect = el.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;
            e.preventDefault();
        });

        $(window).on('mousemove', (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            this.element.css({
                top: initialTop + dy,
                left: initialLeft + dx,
                right: 'auto'
            });
        });

        $(window).on('mouseup', () => {
            isDragging = false;
        });

        // Toggle Lock
        html.find('.hud-lock').on('click', (ev) => {
            const icon = $(ev.currentTarget).find('i');
            const isLocked = icon.hasClass('fa-lock');
            
            if (isLocked) {
                icon.removeClass('fa-lock').addClass('fa-lock-open');
                header.removeClass('locked');
            } else {
                icon.removeClass('fa-lock-open').addClass('fa-lock');
                header.addClass('locked');
            }
        });
    }
}
