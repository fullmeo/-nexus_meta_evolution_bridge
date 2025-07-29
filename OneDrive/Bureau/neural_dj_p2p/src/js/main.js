// Point d'entrée principal de l'application NeuralMix P2P

// Importation des modules
import { AudioSync } from './modules/audioSync.js';
import { NeuralSync } from './modules/neuralSync.js';

// Initialisation de l'application
class NeuralMixApp {
    constructor() {
        this.audioSync = new AudioSync();
        this.neuralSync = new NeuralSync();
        
        this.initializeApp();
    }
    
    async initializeApp() {
        console.log('Initialisation de NeuralMix P2P...');
        
        // Initialisation des modules
        await this.audioSync.initialize();
        this.neuralSync.initialize();
        
        // Configuration des écouteurs d'événements
        this.setupEventListeners();
        
        console.log('Application prête !');
    }
    
    setupEventListeners() {
        // Configuration des écouteurs d'événements de l'interface utilisateur
        document.addEventListener('DOMContentLoaded', () => {
            // Exemple d'écouteur pour le bouton d'activation du micro
            const micButton = document.getElementById('enable-mic');
            if (micButton) {
                micButton.addEventListener('click', async () => {
                    await this.audioSync.enableInput();
                });
            }
            
            // Autres écouteurs d'événements...
        });
    }
}

// Démarrer l'application
const app = new NeuralMixApp();

// Exporter pour une utilisation dans d'autres fichiers
window.NeuralMixApp = app;
