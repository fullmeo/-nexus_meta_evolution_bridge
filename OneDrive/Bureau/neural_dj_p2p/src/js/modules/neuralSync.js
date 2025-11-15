// neuralSync.js — Module de synchronisation AI pour NeuralMix P2P Enhanced

class NeuralSync {
    constructor() {
        this.currentBPM = 0;
        this.aiConfidence = 0;
        this.beatAligned = false;
        this.onStatusUpdate = null; // Callback pour les mises à jour de statut
        this.onEffectSync = null;   // Callback pour la synchronisation des effets
    }

    /**
     * Met à jour les données de synchronisation
     * @param {Object} data - Les données de synchronisation
     * @param {number} data.bpm - Le BPM détecté
     * @param {number} data.confidence - Niveau de confiance de l'IA (0-100)
     * @param {boolean} data.align - Si le beat est aligné
     */
    updateSyncData({ bpm, confidence, align }) {
        this.currentBPM = bpm;
        this.aiConfidence = confidence;
        this.beatAligned = align;

        // Si un callback de synchronisation des effets est défini
        if (typeof this.onEffectSync === 'function') {
            this.onEffectSync({
                bpm: this.currentBPM,
                confidence: this.aiConfidence,
                aligned: this.beatAligned
            });
        }

        // Diffuser le statut
        this.broadcastSyncStatus();
    }

    /**
     * Synchronise automatiquement deux pistes
     * @param {Object} deckAData - Données du deck A
     * @param {number} deckAData.bpm - BPM du deck A
     * @param {number} deckAData.confidence - Confiance IA du deck A (0-100)
     * @param {Object} deckBData - Données du deck B
     * @param {number} deckBData.bpm - BPM du deck B
     * @param {number} deckBData.confidence - Confiance IA du deck B (0-100)
     */
    autoSyncTracks(deckAData, deckBData) {
        const bpmA = deckAData.bpm;
        const bpmB = deckBData.bpm;
        const confidenceA = deckAData.confidence;
        const confidenceB = deckBData.confidence;

        const averageBPM = Math.round((bpmA + bpmB) / 2);
        const averageConfidence = Math.round((confidenceA + confidenceB) / 2);
        const areAligned = Math.abs(bpmA - bpmB) <= 5;

        this.updateSyncData({
            bpm: averageBPM,
            confidence: averageConfidence,
            align: areAligned
        });

        return {
            success: areAligned,
            bpm: averageBPM,
            confidence: averageConfidence
        };
    }

    /**
     * Diffuse le statut de synchronisation
     * @private
     */
    broadcastSyncStatus() {
        if (typeof this.onStatusUpdate === 'function') {
            const status = {
                bpm: this.currentBPM,
                aligned: this.beatAligned,
                confidence: this.aiConfidence,
                timestamp: Date.now(),
                statusText: `🧠 Sync: ${this.currentBPM} BPM | Aligné: ${this.beatAligned ? "✅" : "❌"} | Confiance AI: ${this.aiConfidence}%`
            };
            this.onStatusUpdate(status);
        }
    }

    /**
     * Configure le callback de mise à jour de statut
     * @param {Function} callback - Fonction appelée lors des mises à jour de statut
     */
    setStatusCallback(callback) {
        this.onStatusUpdate = callback;
    }

    /**
     * Configure le callback de synchronisation des effets
     * @param {Function} callback - Fonction appelée pour synchroniser les effets
     */
    setEffectSyncCallback(callback) {
        this.onEffectSync = callback;
    }
}

// Export de la classe et d'une instance singleton
export { NeuralSync };

const neuralSync = new NeuralSync();
export default neuralSync;
