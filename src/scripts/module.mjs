import { OverlayManager } from '../apps/OverlayManager.mjs';

Hooks.once('init', () => {
    console.log('Foundry Module | Initializing module');
    
    // Instancia e inicializa o gerenciador de overlay
    const overlay = new OverlayManager();
    overlay.init();
});
