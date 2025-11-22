/**
 * onboarding.js
 * 
 * Implements the "Act 0" onboarding guide / quest tracker.
 * Guides new players through the initial mechanics of the game.
 */

import { player } from './player.js';
// logAction is available globally via window.logAction

const tutorialSteps = [
    {
        id: "welcome",
        text: "Welcome to the streets. Check your stats.",
        check: () => true, // Always true, just an intro
        next: "first_job"
    },
    {
        id: "first_job",
        text: "Complete a 'Mug Civilian' job to earn cash.",
        check: () => player.missions.missionStats.jobsCompleted > 0,
        next: "buy_weapon"
    },
    {
        id: "buy_weapon",
        text: "Buy a weapon from the Black Market.",
        check: () => player.inventory.some(item => item.type === 'weapon'),
        next: "gain_rep"
    },
    {
        id: "gain_rep",
        text: "Reach level 2 to unlock factions.",
        check: () => player.level >= 2,
        next: "contact_faction"
    },
    {
        id: "contact_faction",
        text: "Complete a job for any Crime Family.",
        check: () => player.missions.missionStats.factionMissionsCompleted > 0,
        next: "complete"
    },
    {
        id: "complete",
        text: "Tutorial Complete. Build your empire!",
        check: () => false, // End state
        next: null
    }
];

let currentStepIndex = 0;
let isTutorialActive = true;

export function initOnboarding() {
    // Check if tutorial is already done (could be saved in localStorage)
    const savedStep = localStorage.getItem('tutorialStep');
    if (savedStep) {
        const index = tutorialSteps.findIndex(s => s.id === savedStep);
        if (index !== -1) {
            currentStepIndex = index;
        }
    }
    
    if (currentStepIndex >= tutorialSteps.length - 1) {
        isTutorialActive = false;
        return;
    }

    createTrackerUI();
    updateTracker();
}

function createTrackerUI() {
    const tracker = document.createElement('div');
    tracker.id = 'tutorial-tracker';
    tracker.style.position = 'fixed';
    tracker.style.top = '10px';
    tracker.style.right = '10px';
    tracker.style.background = 'rgba(0, 0, 0, 0.8)';
    tracker.style.color = '#fff';
    tracker.style.padding = '10px';
    tracker.style.border = '1px solid #444';
    tracker.style.borderRadius = '5px';
    tracker.style.zIndex = '1000';
    tracker.style.fontFamily = 'monospace';
    tracker.style.maxWidth = '250px';
    tracker.innerHTML = `
        <h4 style="margin: 0 0 5px 0; color: #ffd700;">Current Objective</h4>
        <div id="tutorial-tracker-text">Loading...</div>
    `;
    document.body.appendChild(tracker);
}

export function updateTracker() {
    if (!isTutorialActive) return;

    const step = tutorialSteps[currentStepIndex];
    const trackerText = document.getElementById('tutorial-tracker-text');
    
    if (trackerText) {
        trackerText.textContent = step.text;
    }

    // Check for completion
    if (step.check()) {
        if (step.next) {
            // Advance to next step
            const nextIndex = tutorialSteps.findIndex(s => s.id === step.next);
            if (nextIndex !== -1) {
                currentStepIndex = nextIndex;
                localStorage.setItem('tutorialStep', step.next);
                
                // Flash effect or sound could go here
                if (window.logAction) window.logAction(`✅ Objective Complete: ${step.text}`);
                
                // Recursively update to show new text immediately
                updateTracker();
            }
        } else {
            // Tutorial finished
            isTutorialActive = false;
            localStorage.setItem('tutorialStep', 'complete');
            if (window.logAction) window.logAction("🏆 You've learned the basics. Now go run this city!");
            const tracker = document.getElementById('tutorial-tracker');
            if (tracker) tracker.remove();
        }
    }
}

// Expose to window for debugging or manual triggers
window.checkTutorial = updateTracker;
