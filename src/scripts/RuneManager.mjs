export class RuneManager {
    static ID = "foundry-module";
    static FLAGS = {
        ETHER: "ether",
        KNOWN_SCRIPTS: "knownScripts",
        KNOWN_VERBS: "knownVerbs",
        KNOWN_SOURCES: "knownSources"
    }

    /**
     * Obtém a lista de runas conhecidas de um tipo
     * @param {Actor} actor 
     * @param {string} type 'verbs', 'nouns', 'source'
     * @returns {string[]} Array de IDs das runas
     */
    static getKnownRunes(actor, type) {
        let flagKey;
        switch (type) {
            case 'verbs': flagKey = this.FLAGS.KNOWN_VERBS; break;
            case 'nouns': flagKey = this.FLAGS.KNOWN_SCRIPTS; break;
            case 'source': flagKey = this.FLAGS.KNOWN_SOURCES; break;
            default: return [];
        }
        return actor.getFlag(this.ID, flagKey) || [];
    }

    /**
     * Alterna o estado de conhecimento de uma runa
     * @param {Actor} actor 
     * @param {string} type 
     * @param {string} runeId 
     */
    static async toggleRune(actor, type, runeId) {
        let flagKey;
        switch (type) {
            case 'verbs': flagKey = this.FLAGS.KNOWN_VERBS; break;
            case 'nouns': flagKey = this.FLAGS.KNOWN_SCRIPTS; break;
            case 'source': flagKey = this.FLAGS.KNOWN_SOURCES; break;
            default: return;
        }

        const known = this.getKnownRunes(actor, type);
        const idx = known.indexOf(runeId);
        
        if (idx >= 0) {
            known.splice(idx, 1);
        } else {
            known.push(runeId);
        }

        await actor.setFlag(this.ID, flagKey, known);
    }

    /**
     * Obtém a quantidade atual de Éter do ator
     * @param {Actor} actor 
     * @returns {number}
     */
    static getEther(actor) {
        return actor.getFlag(this.ID, this.FLAGS.ETHER) || 0;
    }

    /**
     * Define a quantidade de Éter
     * @param {Actor} actor 
     * @param {number} value 
     */
    static async setEther(actor, value) {
        // Garante que não seja negativo
        const safeValue = Math.max(0, value);
        await actor.setFlag(this.ID, this.FLAGS.ETHER, safeValue);
        
        // Dispara hook para avisar a UI que mudou
        Hooks.callAll("updateRuneMaker", actor);
    }

    /**
     * Calcula o EC Máximo (Ether Cap)
     * Fórmula: Nível + Mod. CON + Upgrades
     * @param {Actor} actor 
     * @returns {number}
     */
    static getECMax(actor) {
        // Tenta pegar dados do sistema (suporte básico para dnd5e e pf2e)
        let level = 1;
        let con = 0;

        // PF2e
        if (actor.system.details?.level?.value !== undefined) {
            level = actor.system.details.level.value;
        } 
        // DnD5e
        else if (actor.system.details?.level !== undefined) {
            level = actor.system.details.level;
        }

        // Abilities (ambos usam system.abilities.con.mod geralmente)
        if (actor.system.abilities?.con?.mod !== undefined) {
            con = actor.system.abilities.con.mod;
        }

        // Upgrades fixos nos níveis 5, 10, 15, 20 (+2 cada)
        let upgrades = 0;
        if (level >= 5) upgrades += 2;
        if (level >= 10) upgrades += 2;
        if (level >= 15) upgrades += 2;
        if (level >= 20) upgrades += 2;

        return level + con + upgrades;
    }

    /**
     * Adiciona ou remove Éter
     * @param {Actor} actor 
     * @param {number} amount 
     * @returns {Promise<boolean>} True se entrou em sobrecarga (Overload)
     */
    static async modifyEther(actor, amount) {
        const current = this.getEther(actor);
        const max = this.getECMax(actor);
        const newValue = current + amount;
        
        await this.setEther(actor, newValue);

        // Retorna true se estourou o limite
        return newValue > max;
    }

    /**
     * Purga o cache (resfria o sistema)
     * @param {Actor} actor 
     * @param {boolean} full Se true, remove tudo (Crash/Tela Azul). Se false, usa regra de purgar normal.
     */
    static async purgeCache(actor, full = false) {
        if (full) {
            await this.setEther(actor, 0);
            return;
        }

        // Regra: Nível 1-6: Metade INT. Nível 7+: INT total.
        let intMod = actor.system.abilities?.int?.mod || 0;
        let level = actor.system.details?.level?.value || actor.system.details?.level || 1;
        
        let removeAmount = 0;
        if (level >= 7) {
            removeAmount = intMod;
        } else {
            removeAmount = Math.max(1, Math.floor(intMod / 2));
        }

        await this.modifyEther(actor, -removeAmount);
    }
}
