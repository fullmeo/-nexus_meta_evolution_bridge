// Exemple d'utilisation du module NeuralSync
import neuralSync from './neuralSync.js';

// 1. Configuration des callbacks
neuralSync.setStatusCallback((status) => {
    console.log('[NeuralSync]', status.statusText);
    
    // Mettre à jour l'interface utilisateur
    const statusElement = document.getElementById('sync-status');
    if (statusElement) {
        statusElement.textContent = status.statusText;
        statusElement.className = status.aligned ? 'sync-ok' : 'sync-warning';
    }
});

neuralSync.setEffectSyncCallback(({ bpm, confidence, aligned }) => {
    console.log(`[NeuralSync] Synchronisation des effets - BPM: ${bpm}, Confiance: ${confidence}%`);
    
    // Ici, vous pourriez ajouter la logique pour synchroniser les effets
    // audio en fonction du BPM et de la confiance
    if (aligned) {
        // Activer les effets de synchronisation
        console.log('[NeuralSync] Effets synchronisés avec succès!');
    } else {
        // Désactiver ou ajuster les effets
        console.log('[NeuralSync] Synchronisation des effets désactivée');
    }
});

// 2. Exemple d'analyse de deux decks
function analyzeDecks(deckA, deckB) {
    console.log('Analyse des decks en cours...');
    
    // Simuler l'analyse des decks (remplacer par votre logique d'analyse réelle)
    const deckAData = {
        bpm: deckA.bpm || 128,
        confidence: deckA.confidence || 90
    };
    
    const deckBData = {
        bpm: deckB.bpm || 130,
        confidence: deckB.confidence || 85
    };
    
    // Synchroniser automatiquement les deux decks
    const result = neuralSync.autoSyncTracks(deckAData, deckBData);
    
    console.log('Résultat de la synchronisation:', result);
    return result;
}

// 3. Exemple d'utilisation avec des données de test
const testDeckA = { bpm: 128, confidence: 92 };
const testDeckB = { bpm: 129, confidence: 88 };

// Lancer l'analyse
document.addEventListener('DOMContentLoaded', () => {
    analyzeDecks(testDeckA, testDeckB);
    
    // Exemple de mise à jour en temps réel
    setTimeout(() => {
        console.log('Mise à jour des BPM...');
        testDeckA.bpm = 130;
        testDeckB.bpm = 130; // Les BPM correspondent maintenant
        analyzeDecks(testDeckA, testDeckB);
    }, 3000);
});

// 4. Fonctions utilitaires pour l'intégration avec l'application existante
export function setupNeuralSync() {
    // Intégration avec l'interface utilisateur existante
    const syncButton = document.getElementById('sync-button');
    if (syncButton) {
        syncButton.addEventListener('click', () => {
            const deckA = {
                bpm: parseFloat(document.getElementById('deck-a-bpm').value) || 128,
                confidence: 90
            };
            
            const deckB = {
                bpm: parseFloat(document.getElementById('deck-b-bpm').value) || 128,
                confidence: 90
            };
            
            analyzeDecks(deckA, deckB);
        });
    }
}

// 5. Exporter les fonctions principales pour une utilisation dans d'autres modules
export { analyzeDecks };
