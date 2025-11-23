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
        text: "Complete a 'Street Soldier' job to earn cash.",
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
    const isMobileDevice = document.body.classList.contains('mobile-device') || window.innerWidth <= 768;
    
    // Create modal overlay for mobile (hidden by default)
    if (isMobileDevice) {
        const overlay = document.createElement('div');
        overlay.id = 'tutorial-tracker-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 9999;
            display: none;
            justify-content: center;
            align-items: center;
        `;
        
        // Close overlay when clicking on it (outside the tracker)
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.style.display = 'none';
                tracker.style.display = 'none';
            }
        });
        
        document.body.appendChild(overlay);
    }
    
    const tracker = document.createElement('div');
    tracker.id = 'tutorial-tracker';
    tracker.style.position = 'fixed';
    
    if (isMobileDevice) {
        // Mobile: centered modal style, hidden by default
        tracker.style.top = '50%';
        tracker.style.left = '50%';
        tracker.style.transform = 'translate(-50%, -50%)';
        tracker.style.display = 'none';
        tracker.style.zIndex = '10000';
        tracker.style.maxWidth = '90%';
        tracker.style.width = '320px';
    } else {
        // Desktop: top-right corner, always visible
        tracker.style.top = '10px';
        tracker.style.right = '10px';
        tracker.style.display = 'block';
        tracker.style.zIndex = '1000';
        tracker.style.maxWidth = '250px';
    }
    
    tracker.style.background = 'rgba(0, 0, 0, 0.95)';
    tracker.style.color = '#fff';
    tracker.style.padding = '15px';
    tracker.style.border = '2px solid #ffd700';
    tracker.style.borderRadius = '8px';
    tracker.style.fontFamily = 'monospace';
    tracker.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.5)';
    
    tracker.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 10px;">
            <h4 style="margin: 0; color: #ffd700; font-size: 14px;">Current Objective</h4>
            ${isMobileDevice ? '<button class="tutorial-tracker-close" style="background: #8b0000; border: 1px solid #ff0000; color: #fff; border-radius: 4px; font-size: 12px; padding: 4px 8px; cursor: pointer; font-weight: bold; touch-action: manipulation;">Close</button>' : ''}
        </div>
        <div class="tutorial-tracker-body" style="font-size: 13px; line-height: 1.4;">
            <div id="tutorial-tracker-text">Loading...</div>
        </div>
    `;
    
    document.body.appendChild(tracker);

    // Mobile close button - setup AFTER adding to DOM
    if (isMobileDevice) {
        const closeButton = tracker.querySelector('.tutorial-tracker-close');
        if (closeButton) {
            closeButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                tracker.style.display = 'none';
                const overlay = document.getElementById('tutorial-tracker-overlay');
                if (overlay) overlay.style.display = 'none';
            });
        }
    }
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
                if (window.logAction) window.logAction(`Objective Complete: ${step.text}`);
                
                // Recursively update to show new text immediately
                updateTracker();
            }
        } else {
            // Tutorial finished
            isTutorialActive = false;
            localStorage.setItem('tutorialStep', 'complete');
            if (window.logAction) window.logAction("You've learned the basics. Now go run this city!");
            const tracker = document.getElementById('tutorial-tracker');
            if (tracker) tracker.remove();
        }
    }
}

// Expose to window for debugging or manual triggers
window.checkTutorial = updateTracker;
