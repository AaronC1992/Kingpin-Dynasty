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
    
    // Desktop: Use the right panel objective section (already in HTML)
    // Mobile: Create modal overlay and popup
    
    if (isMobileDevice) {
        // Create modal overlay for mobile (hidden by default)
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
                const tracker = document.getElementById('tutorial-tracker');
                if (tracker) tracker.style.display = 'none';
            }
        });
        
        document.body.appendChild(overlay);
        
        // Create mobile tracker modal
        const tracker = document.createElement('div');
        tracker.id = 'tutorial-tracker';
        tracker.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            display: none;
            z-index: 10000;
            max-width: 90%;
            width: 320px;
            background: rgba(0, 0, 0, 0.95);
            color: #fff;
            padding: 15px;
            border: 2px solid #ffd700;
            border-radius: 8px;
            font-family: monospace;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        `;
        
        tracker.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 10px;">
                <h4 style="margin: 0; color: #ffd700; font-size: 14px;">Current Objective</h4>
                <button class="tutorial-tracker-close" style="background: #8b0000; border: 1px solid #ff0000; color: #fff; border-radius: 4px; font-size: 12px; padding: 4px 8px; cursor: pointer; font-weight: bold; touch-action: manipulation;">Close</button>
            </div>
            <div class="tutorial-tracker-body" style="font-size: 13px; line-height: 1.4;">
                <div id="tutorial-tracker-text-mobile">Loading...</div>
            </div>
        `;
        
        document.body.appendChild(tracker);
        
        // Mobile close button - setup AFTER adding to DOM
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
    // Desktop uses the built-in right panel section, no need to create tracker element
}

export function updateTracker() {
    if (!isTutorialActive) return;

    const step = tutorialSteps[currentStepIndex];
    
    // Update desktop tracker (right panel)
    const trackerTextDesktop = document.getElementById('tutorial-tracker-text');
    if (trackerTextDesktop) {
        trackerTextDesktop.textContent = step.text;
    }
    
    // Update mobile tracker (popup)
    const trackerTextMobile = document.getElementById('tutorial-tracker-text-mobile');
    if (trackerTextMobile) {
        trackerTextMobile.textContent = step.text;
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
            
            // Update both desktop and mobile to show completion
            if (trackerTextDesktop) trackerTextDesktop.textContent = 'Tutorial Complete!';
            if (trackerTextMobile) trackerTextMobile.textContent = 'Tutorial Complete!';
            
            // Remove mobile tracker after a delay
            const tracker = document.getElementById('tutorial-tracker');
            if (tracker) {
                setTimeout(() => tracker.remove(), 3000);
            }
        }
    }
}

// Expose to window for debugging or manual triggers
window.checkTutorial = updateTracker;
