/**
 * onboarding.js
 * 
 * Implements the "Act 0" onboarding guide / quest tracker.
 * Guides new players through the initial mechanics of the game.
 * Phase D: Added skip button, progress indicator, visual highlighting, celebration on step complete.
 */

import { player } from './player.js';
// logAction is available globally via window.logAction

const tutorialSteps = [
    {
        id: "welcome",
        text: "Welcome to the streets. Look at the stats bar above — it shows your cash, health, energy and rank.",
        check: () => false, // Manual advance only — auto-advances after 5 seconds
        next: "first_job",
        autoAdvanceMs: 5000,
        highlight: '#stats-bar'
    },
    {
        id: "first_job",
        text: "Complete a 'Street Soldier' job to earn cash.",
        check: () => player.missions.missionStats.jobsCompleted > 0,
        next: "buy_weapon",
        highlight: '[onclick*="showJobs"], [onclick*="doJob"]'
    },
    {
        id: "buy_weapon",
        text: "Buy a weapon from the Black Market.",
        check: () => player.inventory.some(item => item.type === 'weapon'),
        next: "gain_rep",
        highlight: '[onclick*="showStore"], [onclick*="Market"]'
    },
    {
        id: "gain_rep",
        text: "Reach level 2 to unlock factions.",
        check: () => player.level >= 2,
        next: "contact_faction",
        highlight: '#level-display, #experience-display'
    },
    {
        id: "contact_faction",
        text: "Complete a job for any Crime Family.",
        check: () => player.missions.missionStats.factionMissionsCompleted > 0,
        next: "complete",
        highlight: '[onclick*="showFaction"], [onclick*="faction"]'
    },
    {
        id: "complete",
        text: "Tutorial Complete! Build your empire!",
        check: () => false, // End state
        next: null
    }
];

let currentStepIndex = 0;
let isTutorialActive = true;
let highlightCleanup = null;
let autoAdvanceTimeout = null;

export function initOnboarding() {
    // Check if tutorial is already done (could be saved in localStorage)
    const savedStep = localStorage.getItem('tutorialStep');
    if (savedStep === 'skipped') {
        isTutorialActive = false;
        const objSection = document.getElementById('objective-tracker-section');
        if (objSection) objSection.style.display = 'none';
        return;
    }
    if (savedStep) {
        const index = tutorialSteps.findIndex(s => s.id === savedStep);
        if (index !== -1) {
            currentStepIndex = index;
        }
    }
    
    if (currentStepIndex >= tutorialSteps.length - 1) {
        isTutorialActive = false;
        const objSection = document.getElementById('objective-tracker-section');
        if (objSection) objSection.style.display = 'none';
        return;
    }

    createTrackerUI();
    updateTracker();
}

function skipTutorial() {
    isTutorialActive = false;
    localStorage.setItem('tutorialStep', 'skipped');
    clearHighlight();
    if (autoAdvanceTimeout) { clearTimeout(autoAdvanceTimeout); autoAdvanceTimeout = null; }
    if (window.logAction) window.logAction("Tutorial skipped. You're on your own, wiseguy.");
    
    // Remove mobile tracker elements
    const tracker = document.getElementById('tutorial-tracker');
    if (tracker) tracker.remove();
    const overlay = document.getElementById('tutorial-tracker-overlay');
    if (overlay) overlay.remove();
    
    // Update desktop tracker
    const trackerTextDesktop = document.getElementById('tutorial-tracker-text');
    if (trackerTextDesktop) trackerTextDesktop.textContent = 'Tutorial Skipped';
    // Hide the objective tracker section entirely
    const objSection = document.getElementById('objective-tracker-section');
    if (objSection) objSection.style.display = 'none';
    
    // Remove desktop progress bar and step counter (with Skip button)
    const progressBar = document.getElementById('tutorial-progress-bar-desktop');
    if (progressBar) progressBar.remove();
    const stepCounter = document.getElementById('tutorial-step-counter-desktop');
    if (stepCounter) stepCounter.remove();
    // Rebuild mobile nav bar to swap out Objective tab (only on mobile/tablet)
    if (typeof MobileSystem !== 'undefined' && MobileSystem.createMobileQuickActions && (MobileSystem.isMobile || MobileSystem.isTablet)) {
        MobileSystem.createMobileQuickActions();
    }
}

// Expose skip function globally
window.skipTutorial = skipTutorial;
window._onboardingSkipTutorial = skipTutorial;

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
                <div style="display: flex; gap: 6px;">
                    <button class="tutorial-tracker-skip" style="background: #555; border: 1px solid #888; color: #ccc; border-radius: 4px; font-size: 11px; padding: 4px 8px; cursor: pointer; touch-action: manipulation;">Skip All</button>
                    <button class="tutorial-tracker-close" style="background: #8b0000; border: 1px solid #ff0000; color: #fff; border-radius: 4px; font-size: 12px; padding: 4px 8px; cursor: pointer; font-weight: bold; touch-action: manipulation;">Close</button>
                </div>
            </div>
            <div id="tutorial-progress-bar" style="background: #333; border-radius: 4px; height: 6px; margin-bottom: 10px; overflow: hidden;">
                <div id="tutorial-progress-fill" style="background: #ffd700; height: 100%; width: 0%; transition: width 0.3s ease; border-radius: 4px;"></div>
            </div>
            <div class="tutorial-tracker-body" style="font-size: 13px; line-height: 1.4;">
                <div id="tutorial-tracker-text-mobile">Loading...</div>
                <div id="tutorial-step-counter-mobile" style="color: #888; font-size: 11px; margin-top: 6px;"></div>
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
        
        const skipButton = tracker.querySelector('.tutorial-tracker-skip');
        if (skipButton) {
            skipButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                skipTutorial();
            });
        }
    }
    // Desktop uses the built-in right panel section, no need to create tracker element
    // But add skip button + progress to desktop tracker too
    const desktopTracker = document.getElementById('tutorial-tracker-text');
    if (desktopTracker && desktopTracker.parentElement) {
        const parent = desktopTracker.parentElement;
        // Add progress bar above text
        if (!document.getElementById('tutorial-progress-bar-desktop')) {
            const progressBar = document.createElement('div');
            progressBar.id = 'tutorial-progress-bar-desktop';
            progressBar.style.cssText = 'background:#333;border-radius:4px;height:5px;margin:6px 0;overflow:hidden;';
            progressBar.innerHTML = '<div id="tutorial-progress-fill-desktop" style="background:#ffd700;height:100%;width:0%;transition:width 0.3s ease;border-radius:4px;"></div>';
            parent.insertBefore(progressBar, desktopTracker);
        }
        // Add step counter + skip below text
        if (!document.getElementById('tutorial-step-counter-desktop')) {
            const counterDiv = document.createElement('div');
            counterDiv.id = 'tutorial-step-counter-desktop';
            counterDiv.style.cssText = 'color:#888;font-size:0.8em;margin-top:4px;display:flex;justify-content:space-between;align-items:center;';
            counterDiv.innerHTML = '<span id="tutorial-counter-text"></span><button onclick="skipTutorial()" style="background:none;border:1px solid #666;color:#888;font-size:0.8em;padding:2px 8px;border-radius:3px;cursor:pointer;">Skip</button>';
            parent.appendChild(counterDiv);
        }
    }
}

export function updateTracker() {
    if (!isTutorialActive) return;

    const step = tutorialSteps[currentStepIndex];
    const totalSteps = tutorialSteps.length - 1; // Exclude 'complete' end-state
    const progressPct = Math.round((currentStepIndex / totalSteps) * 100);
    const stepLabel = `Step ${Math.min(currentStepIndex + 1, totalSteps)} of ${totalSteps}`;
    
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
    
    // Update progress bars
    const fillDesktop = document.getElementById('tutorial-progress-fill-desktop');
    if (fillDesktop) fillDesktop.style.width = progressPct + '%';
    const fillMobile = document.getElementById('tutorial-progress-fill');
    if (fillMobile) fillMobile.style.width = progressPct + '%';
    
    // Update step counters
    const counterDesktop = document.getElementById('tutorial-counter-text');
    if (counterDesktop) counterDesktop.textContent = stepLabel;
    const counterMobile = document.getElementById('tutorial-step-counter-mobile');
    if (counterMobile) counterMobile.textContent = stepLabel;
    
    // Apply visual highlight on relevant UI elements
    applyHighlight(step.highlight);
    
    // Handle auto-advance for welcome step
    if (step.autoAdvanceMs && !autoAdvanceTimeout) {
        autoAdvanceTimeout = setTimeout(() => {
            autoAdvanceTimeout = null;
            advanceStep(step);
        }, step.autoAdvanceMs);
    }

    // Check for completion
    if (step.check()) {
        advanceStep(step);
    }
}

function advanceStep(step) {
    if (!step.next) {
        // Tutorial finished
        isTutorialActive = false;
        localStorage.setItem('tutorialStep', 'complete');
        clearHighlight();
        if (window.logAction) window.logAction("🎓 You've learned the basics. Now go run this city!");
        celebrateCompletion();
        
        const trackerTextDesktop = document.getElementById('tutorial-tracker-text');
        if (trackerTextDesktop) trackerTextDesktop.textContent = '🎓 Tutorial Complete!';
        const trackerTextMobile = document.getElementById('tutorial-tracker-text-mobile');
        if (trackerTextMobile) trackerTextMobile.textContent = '🎓 Tutorial Complete!';
        
        // Fill progress to 100%
        const fillDesktop = document.getElementById('tutorial-progress-fill-desktop');
        if (fillDesktop) fillDesktop.style.width = '100%';
        const fillMobile = document.getElementById('tutorial-progress-fill');
        if (fillMobile) fillMobile.style.width = '100%';
        
        const tracker = document.getElementById('tutorial-tracker');
        if (tracker) {
            setTimeout(() => tracker.remove(), 5000);
        }
        
        // Remove step counter (with Skip button) on completion
        const stepCounter = document.getElementById('tutorial-step-counter-desktop');
        if (stepCounter) stepCounter.remove();
        
        return;
    }
    
    const nextIndex = tutorialSteps.findIndex(s => s.id === step.next);
    if (nextIndex !== -1) {
        currentStepIndex = nextIndex;
        localStorage.setItem('tutorialStep', step.next);
        
        // Celebrate step completion with a brief flash
        celebrateStepComplete(step.text);
        if (window.logAction) window.logAction(`✅ Objective Complete: ${step.text}`);
        
        // Recursively update to show new text immediately
        updateTracker();
    }
}

function celebrateStepComplete(stepText) {
    // Brief gold flash on screen border
    const flash = document.createElement('div');
    flash.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:9999;border:3px solid #ffd700;box-shadow:inset 0 0 30px rgba(255,215,0,0.3);animation:tutFlash 0.6s ease-out forwards;';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 700);
}

function celebrateCompletion() {
    // Bigger celebration for tutorial finish
    const flash = document.createElement('div');
    flash.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:9999;border:4px solid #ffd700;box-shadow:inset 0 0 60px rgba(255,215,0,0.4);animation:tutFlash 1.2s ease-out forwards;';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 1300);
}

// Add the flash animation CSS once
(function injectTutorialCSS() {
    if (document.getElementById('tutorial-anim-css')) return;
    const style = document.createElement('style');
    style.id = 'tutorial-anim-css';
    style.textContent = `
        @keyframes tutFlash { from { opacity: 1; } to { opacity: 0; } }
        @keyframes tutPulse { 0%, 100% { box-shadow: 0 0 8px 2px rgba(255,215,0,0.6); } 50% { box-shadow: 0 0 16px 6px rgba(255,215,0,0.9); } }
        .tutorial-highlight { animation: tutPulse 1.2s ease-in-out infinite; outline: 2px solid #ffd700; outline-offset: 2px; border-radius: 4px; position: relative; z-index: 5; }
    `;
    document.head.appendChild(style);
})();

function applyHighlight(selector) {
    clearHighlight();
    if (!selector) return;
    
    try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            el.classList.add('tutorial-highlight');
        });
        highlightCleanup = selector;
    } catch (e) {
        // Invalid selector — skip highlighting
    }
}

function clearHighlight() {
    if (highlightCleanup) {
        try {
            const elements = document.querySelectorAll(highlightCleanup);
            elements.forEach(el => el.classList.remove('tutorial-highlight'));
        } catch (e) { /* ignore */ }
        highlightCleanup = null;
    }
    // Also clear any stale highlights
    document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));
}

// Expose to window for debugging or manual triggers
window.checkTutorial = updateTracker;
