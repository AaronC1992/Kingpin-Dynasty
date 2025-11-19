// ==================== MOBILE RESPONSIVE SYSTEM ====================

// Mobile device detection and responsive handling
const MobileSystem = {
    isMobile: false,
    isTablet: false,
    screenOrientation: 'portrait',
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    
    // Initialize mobile system
    init() {
        this.detectDevice();
        this.setupResponsiveHandling();
        this.applyMobileLayout();
        this.setupOrientationHandling();
        this.optimizeForMobile();
        
        console.log('Mobile System initialized:', {
            isMobile: this.isMobile,
            isTablet: this.isTablet,
            orientation: this.screenOrientation,
            dimensions: `${this.screenWidth}x${this.screenHeight}`
        });
    },
    
    // Detect if device is mobile or tablet
    detectDevice() {
        const userAgent = navigator.userAgent.toLowerCase();
        const mobileKeywords = ['mobile', 'android', 'iphone', 'ipod', 'blackberry', 'windows phone'];
        const tabletKeywords = ['ipad', 'tablet', 'kindle'];
        
        // Check for mobile devices
        this.isMobile = mobileKeywords.some(keyword => userAgent.includes(keyword)) || 
                       /Android.*Mobile|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                       (window.innerWidth <= 768);
        
        // Check for tablets
        this.isTablet = tabletKeywords.some(keyword => userAgent.includes(keyword)) || 
                       (window.innerWidth > 768 && window.innerWidth <= 1024 && 'ontouchstart' in window);
        
        // Touch device detection
        const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        // Mobile-specific detection based on screen size and touch
        if (window.innerWidth <= 480) {
            this.isMobile = true;
        } else if (window.innerWidth <= 768 && hasTouch) {
            this.isMobile = true;
        }
        
        // Update orientation
        this.updateOrientation();
    },
    
    // Update screen orientation
    updateOrientation() {
        this.screenWidth = window.innerWidth;
        this.screenHeight = window.innerHeight;
        this.screenOrientation = this.screenWidth > this.screenHeight ? 'landscape' : 'portrait';
    },
    
    // Setup responsive event handlers
    setupResponsiveHandling() {
        // Handle window resize
        window.addEventListener('resize', () => {
            this.detectDevice();
            this.applyMobileLayout();
        });
        
        // Handle orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.detectDevice();
                this.applyMobileLayout();
                this.handleOrientationChange();
            }, 100);
        });
    },
    
    // Apply mobile-specific layout
    applyMobileLayout() {
        const body = document.body;
        
        // Remove existing mobile classes
        body.classList.remove('mobile-device', 'tablet-device', 'desktop-device', 'portrait-mode', 'landscape-mode');
        
        // Remove any existing floating menu button
        const existingBtn = document.getElementById('mobile-menu-btn');
        if (existingBtn) {
            existingBtn.remove();
        }
        
        // Add appropriate device class
        if (this.isMobile) {
            body.classList.add('mobile-device');
            this.setupMobileLayout();
        } else if (this.isTablet) {
            body.classList.add('tablet-device');
            this.setupTabletLayout();
        } else {
            body.classList.add('desktop-device');
            this.setupDesktopLayout();
        }
        
        // Add orientation class
        body.classList.add(`${this.screenOrientation}-mode`);
        
        // Apply specific mobile optimizations
        if (this.isMobile || this.isTablet) {
            this.optimizeMobileInterface();
        }
    },
    
    // Setup mobile-specific layout
    setupMobileLayout() {
        console.log('Applying mobile layout');
        
        // Hide side panels on mobile
        this.hideSidePanels();
        
        // Adjust main content
        this.adjustMainContent();
        
        // Show mobile navigation
        this.setupMobileNavigation();
        
        // Optimize touch interactions
        this.optimizeTouchInteractions();
    },
    
    // Setup tablet layout
    setupTabletLayout() {
        console.log('Applying tablet layout');
        
        // Tablets can handle side panels but smaller
        this.adjustSidePanelsForTablet();
        
        // Adjust content area
        this.adjustMainContent();
        
        // Optimize for touch
        this.optimizeTouchInteractions();
    },
    
    // Setup desktop layout
    setupDesktopLayout() {
        console.log('Applying desktop layout');
        
        // Show all side panels
        this.showSidePanels();
        
        // Reset content area
        this.resetMainContent();
    },
    
    // Hide side panels for mobile
    hideSidePanels() {
        const actionLog = document.getElementById('action-log');
        const rightPanel = document.getElementById('right-panel');
        
        if (actionLog) {
            actionLog.style.display = 'none';
        }
        
        if (rightPanel) {
            rightPanel.style.display = 'none';
        }
    },
    
    // Show side panels for desktop
    showSidePanels() {
        const actionLog = document.getElementById('action-log');
        const rightPanel = document.getElementById('right-panel');
        
        if (actionLog) {
            actionLog.style.display = 'block';
        }
        
        if (rightPanel) {
            rightPanel.style.display = 'block';
        }
    },
    
    // Adjust side panels for tablet
    adjustSidePanelsForTablet() {
        const actionLog = document.getElementById('action-log');
        const rightPanel = document.getElementById('right-panel');
        
        if (actionLog) {
            actionLog.style.width = '180px';
            actionLog.style.fontSize = '11px';
        }
        
        if (rightPanel) {
            rightPanel.style.width = '160px';
            rightPanel.style.fontSize = '10px';
        }
    },
    
    // Adjust main content area
    adjustMainContent() {
        const gameContainer = document.getElementById('game');
        const allScreens = document.querySelectorAll('.game-screen, #menu');
        
        if (gameContainer) {
            gameContainer.style.width = '95%';
            gameContainer.style.maxWidth = 'none';
            gameContainer.style.margin = '0 auto';
        }
        
        // Adjust all game screens
        allScreens.forEach(screen => {
            if (this.isMobile) {
                screen.style.marginLeft = '0';
                screen.style.marginRight = '0';
                screen.style.width = '100%';
                screen.style.padding = '15px';
            } else if (this.isTablet) {
                screen.style.marginLeft = '200px';
                screen.style.marginRight = '180px';
                screen.style.width = 'calc(100% - 380px)';
                screen.style.padding = '20px';
            }
        });
    },
    
    // Reset main content for desktop
    resetMainContent() {
        const gameContainer = document.getElementById('game');
        const allScreens = document.querySelectorAll('.game-screen, #menu');
        
        if (gameContainer) {
            gameContainer.style.width = '90%';
            gameContainer.style.maxWidth = '800px';
        }
        
        allScreens.forEach(screen => {
            screen.style.marginLeft = '';
            screen.style.marginRight = '';
            screen.style.width = '';
            screen.style.padding = '';
        });
    },
    
    // Setup mobile navigation
    setupMobileNavigation() {
        // Create mobile action log panel that slides from right
        this.createMobileActionPanel();
        this.setupSwipeGestures();
        this.showSwipeHint(); // Show hint on first load
        this.createMobileQuickActions();
    },
    
    // Create mobile menu button (disabled - using swipe gestures instead)
    createMobileMenuButton() {
        // Swipe gestures replace the menu button
        // Remove any existing menu button
        const existingBtn = document.getElementById('mobile-menu-btn');
        if (existingBtn) {
            existingBtn.remove();
        }
    },
    
    // Setup swipe gestures for mobile action panel
    setupSwipeGestures() {
        let startX = 0;
        let startY = 0;
        let endX = 0;
        let endY = 0;
        let isSwipeZone = false;
        
        // Define swipe zone (left edge of screen)
        const swipeZoneWidth = 30; // pixels from left edge
        
        document.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            
            // Check if touch started in the swipe zone (left edge)
            isSwipeZone = startX <= swipeZoneWidth;
        }, { passive: true });
        
        document.addEventListener('touchmove', (e) => {
            if (!isSwipeZone) return;
            
            const touch = e.touches[0];
            endX = touch.clientX;
            endY = touch.clientY;
        }, { passive: true });
        
        document.addEventListener('touchend', (e) => {
            if (!isSwipeZone) return;
            
            const deltaX = endX - startX;
            const deltaY = Math.abs(startY - endY);
            
            // Check if it's a valid right swipe (swipe from left edge to right)
            if (deltaX > 50 && deltaY < 100) {
                this.openActionPanel();
            }
            
            isSwipeZone = false;
        }, { passive: true });
        
        // Detect swipe to close (swipe left when panel is open)
        document.addEventListener('touchstart', (e) => {
            const panel = document.getElementById('mobile-action-panel');
            if (panel && panel.style.left === '0px') {
                const touch = e.touches[0];
                startX = touch.clientX;
                startY = touch.clientY;
            }
        }, { passive: true });
        
        document.addEventListener('touchend', (e) => {
            const panel = document.getElementById('mobile-action-panel');
            if (panel && panel.style.left === '0px') {
                const touch = e.changedTouches[0];
                endX = touch.clientX;
                endY = touch.clientY;
                
                const deltaX = startX - endX;
                const deltaY = Math.abs(startY - endY);
                
                // Check if it's a left swipe to close
                if (deltaX > 50 && deltaY < 100) {
                    this.closeActionPanel();
                }
            }
        }, { passive: true });
    },
    
    // Create mobile action panel that slides from left
    createMobileActionPanel() {
        // Remove existing panel
        const existingPanel = document.getElementById('mobile-action-panel');
        if (existingPanel) {
            existingPanel.remove();
        }
        
        const actionPanel = document.createElement('div');
        actionPanel.id = 'mobile-action-panel';
        actionPanel.style.cssText = `
            position: fixed;
            top: 0;
            left: -280px;
            width: 280px;
            height: 100vh;
            background: linear-gradient(180deg, #000 0%, #1a1a1a 100%);
            z-index: 999;
            padding: 60px 20px 20px 20px;
            box-sizing: border-box;
            transition: left 0.3s ease;
            overflow-y: auto;
            border-right: 2px solid #c0a062;
            backdrop-filter: blur(10px);
        `;
        
        // Add swipe hint and action log content
        actionPanel.innerHTML = `
            <div style="color: #c0a062; font-family: 'Georgia', serif;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h3 style="color: #c0a062; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 2px;">📜 The Record</h3>
                    <small style="color: #95a5a6; font-style: italic;">Swipe left to close →</small>
                </div>
                
                <div id="mobile-action-list" style="max-height: calc(100vh - 120px); overflow-y: auto; 
                                                   background: rgba(0,0,0,0.4); padding: 15px; border-radius: 8px; 
                                                   font-size: 12px; border: 1px solid #555;">
                    Loading records...
                </div>
                
                <div style="text-align: center; margin-top: 15px;">
                    <small style="color: #95a5a6; font-style: italic;">Showing recent activity</small>
                </div>
                
                <div style="position: absolute; top: 20px; right: 20px;">
                    <button onclick="MobileSystem.closeActionPanel();" 
                            style="background: rgba(139, 0, 0, 0.8); border: 1px solid #ff0000; border-radius: 50%; 
                                   width: 30px; height: 30px; color: white; font-size: 16px; cursor: pointer;">
                        ×
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(actionPanel);
        
        // Update action log content
        this.updateMobileActionLog();
    },
    
    // Open action panel
    openActionPanel() {
        const actionPanel = document.getElementById('mobile-action-panel');
        if (!actionPanel) {
            this.createMobileActionPanel();
            setTimeout(() => this.openActionPanel(), 100);
            return;
        }
        
        // Create overlay
        this.createPanelOverlay();
        
        actionPanel.style.left = '0px';
        
        // Update action log when opened
        setTimeout(() => {
            this.updateMobileActionLog();
        }, 300);
    },
    
    // Close action panel
    closeActionPanel() {
        const actionPanel = document.getElementById('mobile-action-panel');
        if (actionPanel) {
            actionPanel.style.left = '-280px';
        }
        
        // Remove overlay immediately
        this.removePanelOverlay();
        
        // Safety cleanup in case something went wrong
        setTimeout(() => {
            this.cleanupOverlays();
        }, 100);
    },
    
    // Create overlay when panel is open
    createPanelOverlay() {
        // Remove any existing overlays first
        this.removePanelOverlay();
        
        const overlay = document.createElement('div');
        overlay.id = 'mobile-panel-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.3);
            z-index: 998;
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: auto;
        `;
        
        // Tap overlay to close panel
        overlay.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.closeActionPanel();
        });
        
        // Also handle touch events
        overlay.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.closeActionPanel();
        });
        
        document.body.appendChild(overlay);
        
        // Fade in overlay
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
        });
    },
    
    // Remove panel overlay
    removePanelOverlay() {
        // Remove all potential overlays to ensure cleanup
        const overlays = document.querySelectorAll('#mobile-panel-overlay');
        overlays.forEach(overlay => {
            if (overlay && overlay.parentNode) {
                overlay.remove();
            }
        });
        
        // Also remove any stray overlays by class or other selectors
        const straysOverlays = document.querySelectorAll('[id*="overlay"], [id*="mobile-panel"]');
        straysOverlays.forEach(overlay => {
            if (overlay.style.background && overlay.style.background.includes('rgba(0, 0, 0')) {
                overlay.remove();
            }
        });
    },
    
    // Toggle action panel visibility (legacy support)
    toggleActionPanel() {
        const actionPanel = document.getElementById('mobile-action-panel');
        if (!actionPanel) {
            this.openActionPanel();
            return;
        }
        
        const isVisible = actionPanel.style.left === '0px';
        if (isVisible) {
            this.closeActionPanel();
        } else {
            this.openActionPanel();
        }
    },
    
    // Show swipe hint to help users discover the gesture
    showSwipeHint() {
        // Only show once per session
        if (sessionStorage.getItem('swipeHintShown')) {
            return;
        }
        
        const swipeHint = document.createElement('div');
        swipeHint.style.cssText = `
            position: fixed;
            top: 50%;
            left: 10px;
            transform: translateY(-50%);
            background: rgba(192, 160, 98, 0.9);
            color: #000;
            padding: 10px 15px;
            border-radius: 20px;
            font-size: 12px;
            z-index: 1000;
            animation: swipeHintPulse 2s infinite;
            pointer-events: none;
            font-family: 'Georgia', serif;
            font-weight: bold;
            border: 1px solid #000;
        `;
        
        swipeHint.innerHTML = 'Swipe right →<br>for The Record';
        
        // Add animation keyframes
        const style = document.createElement('style');
        style.textContent = `
            @keyframes swipeHintPulse {
                0%, 100% { opacity: 0.7; transform: translateY(-50%) scale(1); }
                50% { opacity: 1; transform: translateY(-50%) scale(1.05); }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(swipeHint);
        
        // Remove hint after 5 seconds
        setTimeout(() => {
            if (swipeHint && swipeHint.parentNode) {
                swipeHint.remove();
            }
            sessionStorage.setItem('swipeHintShown', 'true');
        }, 5000);
    },
    
    // Emergency cleanup function to remove any stuck overlays
    cleanupOverlays() {
        const allOverlays = document.querySelectorAll('[id*="overlay"], [id*="mobile-panel"], [style*="rgba(0, 0, 0"]');
        allOverlays.forEach(overlay => {
            if (overlay.id.includes('overlay') || overlay.id.includes('mobile-panel') || 
                overlay.style.position === 'fixed' && overlay.style.background.includes('rgba(0, 0, 0')) {
                overlay.remove();
            }
        });
        
        // Also ensure body pointer events are restored
        document.body.style.pointerEvents = 'auto';
    },
    
    // Create mobile slide menu (legacy - keeping for compatibility)
    createMobileSlideMenu() {
        const mobileMenu = document.createElement('div');
        mobileMenu.id = 'mobile-slide-menu';
        mobileMenu.style.cssText = `
            position: fixed;
            top: 0;
            left: -280px;
            width: 280px;
            height: 100vh;
            background: linear-gradient(180deg, #000 0%, #1a1a1a 100%);
            z-index: 999;
            padding: 60px 20px 20px 20px;
            box-sizing: border-box;
            transition: left 0.3s ease;
            overflow-y: auto;
            border-right: 2px solid #c0a062;
            backdrop-filter: blur(10px);
        `;
        
        // Add quick actions and navigation
        mobileMenu.innerHTML = `
            <div style="color: #c0a062; font-family: 'Georgia', serif;">
                <h3 style="color: #c0a062; margin: 0 0 20px 0; text-align: center; text-transform: uppercase; letter-spacing: 2px;">Quick Actions</h3>
                
                <button onclick="goBackToMainMenu(); MobileSystem.toggleMobileMenu();" 
                        style="width: 100%; margin: 5px 0; padding: 12px; background: linear-gradient(45deg, #8b0000, #5a0000); 
                               color: white; border: 1px solid #ff0000; border-radius: 6px; font-weight: bold; cursor: pointer; font-family: 'Georgia', serif;">
                    🏠 Safehouse
                </button>
                
                <button onclick="showGlobalChat(); MobileSystem.toggleMobileMenu();" 
                        style="width: 100%; margin: 5px 0; padding: 12px; background: linear-gradient(45deg, #333, #000); 
                               color: #c0a062; border: 1px solid #c0a062; border-radius: 6px; font-weight: bold; cursor: pointer; font-family: 'Georgia', serif;">
                    📞 The Wire
                </button>
                
                <button onclick="showStore(); MobileSystem.toggleMobileMenu();" 
                        style="width: 100%; margin: 5px 0; padding: 12px; background: linear-gradient(45deg, #333, #000); 
                               color: #c0a062; border: 1px solid #c0a062; border-radius: 6px; font-weight: bold; cursor: pointer; font-family: 'Georgia', serif;">
                    🛒 Black Market
                </button>
                
                <button onclick="showJobs(); MobileSystem.toggleMobileMenu();" 
                        style="width: 100%; margin: 5px 0; padding: 12px; background: linear-gradient(45deg, #333, #000); 
                               color: #c0a062; border: 1px solid #c0a062; border-radius: 6px; font-weight: bold; cursor: pointer; font-family: 'Georgia', serif;">
                    💼 Business
                </button>
                
                <button onclick="showGang(); MobileSystem.toggleMobileMenu();" 
                        style="width: 100%; margin: 5px 0; padding: 12px; background: linear-gradient(45deg, #333, #000); 
                               color: #c0a062; border: 1px solid #c0a062; border-radius: 6px; font-weight: bold; cursor: pointer; font-family: 'Georgia', serif;">
                    👥 Family
                </button>
                
                <button onclick="showSkills(); MobileSystem.toggleMobileMenu();" 
                        style="width: 100%; margin: 5px 0; padding: 12px; background: linear-gradient(45deg, #333, #000); 
                               color: #c0a062; border: 1px solid #c0a062; border-radius: 6px; font-weight: bold; cursor: pointer; font-family: 'Georgia', serif;">
                    ⚡ Talents
                </button>
                
                <button onclick="buyEnergy(); MobileSystem.toggleMobileMenu();" 
                        style="width: 100%; margin: 5px 0; padding: 12px; background: linear-gradient(45deg, #f39c12, #d35400); 
                               color: white; border: 1px solid #f39c12; border-radius: 6px; font-weight: bold; cursor: pointer; font-family: 'Georgia', serif;">
                    ⚡ Boost
                </button>
                
                <button onclick="MobileSystem.scrollToActionLog();" 
                        style="width: 100%; margin: 5px 0; padding: 12px; background: linear-gradient(45deg, #333, #000); 
                               color: #c0a062; border: 1px solid #c0a062; border-radius: 6px; font-weight: bold; cursor: pointer; font-family: 'Georgia', serif;">
                    📜 The Record
                </button>
                
                <div id="mobile-action-log" style="margin-top: 30px; border-top: 2px solid #c0a062; padding-top: 20px;">
                    <h4 style="color: #c0a062; margin: 0 0 15px 0; text-align: center; font-size: 16px; font-family: 'Georgia', serif;">📜 Recent Activity</h4>
                    <div id="mobile-action-list" style="max-height: 250px; overflow-y: auto; background: rgba(0,0,0,0.4); 
                                                         padding: 15px; border-radius: 8px; font-size: 12px; border: 1px solid #555;">
                        Loading records...
                    </div>
                    <div style="text-align: center; margin-top: 10px;">
                        <small style="color: #95a5a6; font-style: italic;">Showing last 10 entries</small>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(mobileMenu);
        
        // Update mobile action log
        this.updateMobileActionLog();
    },
    
    // Update mobile action log
    updateMobileActionLog() {
        const mobileActionList = document.getElementById('mobile-action-list');
        if (mobileActionList) {
            // Get actions from the main game's log-list
            const logList = document.getElementById('log-list');
            if (logList) {
                const logItems = Array.from(logList.children);
                const recentActions = logItems.slice(-10).reverse(); // Get last 10 actions, newest first
                
                if (recentActions.length > 0) {
                    mobileActionList.innerHTML = recentActions.map(item => 
                        `<div style="margin: 8px 0; padding: 8px; background: rgba(255,255,255,0.05); 
                                     border-radius: 4px; color: #ecf0f1; font-size: 13px; line-height: 1.4; 
                                     border-left: 3px solid #c0a062; font-family: 'Georgia', serif;">${item.textContent}</div>`
                    ).join('');
                } else {
                    mobileActionList.innerHTML = '<div style="color: #95a5a6; font-style: italic; text-align: center; padding: 20px;">No recent activity</div>';
                }
            } else {
                mobileActionList.innerHTML = '<div style="color: #8b0000; font-style: italic; text-align: center; padding: 20px;">Record not found</div>';
            }
        }
    },
    
    // Scroll to action log in mobile menu
    scrollToActionLog() {
        const actionLogSection = document.getElementById('mobile-action-log');
        if (actionLogSection) {
            actionLogSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Update the action log when scrolled to
            setTimeout(() => {
                this.updateMobileActionLog();
            }, 300);
        }
    },
    
    // Create mobile quick actions bar
    createMobileQuickActions() {
        let quickActionsBar = document.getElementById('mobile-quick-actions');
        
        if (quickActionsBar) {
            quickActionsBar.remove();
        }
        
        quickActionsBar = document.createElement('div');
        quickActionsBar.id = 'mobile-quick-actions';
        quickActionsBar.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            background: linear-gradient(90deg, #000 0%, #1a1a1a 100%);
            padding: 10px;
            box-sizing: border-box;
            z-index: 900;
            border-top: 2px solid #c0a062;
            backdrop-filter: blur(5px);
            box-shadow: 0 -5px 15px rgba(0,0,0,0.5);
        `;
        
        quickActionsBar.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; font-family: 'Georgia', serif;">
                <button onclick="showStore()" 
                        style="padding: 6px; background: linear-gradient(45deg, #333, #000); color: #c0a062; border: 1px solid #c0a062; border-radius: 5px; 
                               font-size: 11px; font-weight: bold; cursor: pointer; font-family: 'Georgia', serif;">
                    🛒<br>Market
                </button>
                <button onclick="showJobs()" 
                        style="padding: 6px; background: linear-gradient(45deg, #333, #000); color: #c0a062; border: 1px solid #c0a062; border-radius: 5px; 
                               font-size: 11px; font-weight: bold; cursor: pointer; font-family: 'Georgia', serif;">
                    💼<br>Biz
                </button>
                <button onclick="showGlobalChat()" 
                        style="padding: 6px; background: linear-gradient(45deg, #333, #000); color: #c0a062; border: 1px solid #c0a062; border-radius: 5px; 
                               font-size: 11px; font-weight: bold; cursor: pointer; font-family: 'Georgia', serif;">
                    📞<br>Wire
                </button>
                <button onclick="showGang()" 
                        style="padding: 6px; background: linear-gradient(45deg, #333, #000); color: #c0a062; border: 1px solid #c0a062; border-radius: 5px; 
                               font-size: 11px; font-weight: bold; cursor: pointer; font-family: 'Georgia', serif;">
                    👥<br>Fam
                </button>
                <button onclick="goBackToMainMenu()" 
                        style="padding: 6px; background: linear-gradient(45deg, #8b0000, #5a0000); color: white; border: 1px solid #ff0000; border-radius: 5px; 
                               font-size: 11px; font-weight: bold; cursor: pointer; font-family: 'Georgia', serif;">
                    🏠<br>Safehouse
                </button>
            </div>
        `;
        
        document.body.appendChild(quickActionsBar);
    },
    
    // Create mobile action log display
    createMobileActionLog() {
        // This is handled in the slide menu
    },
    
    // Optimize touch interactions
    optimizeTouchInteractions() {
        // Increase button sizes for touch
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
            if (this.isMobile) {
                button.style.minHeight = '44px';
                button.style.padding = '12px 16px';
                button.style.fontSize = '14px';
            }
        });
        
        // Add touch feedback
        this.addTouchFeedback();
    },
    
    // Add touch feedback to interactive elements
    addTouchFeedback() {
        const interactiveElements = document.querySelectorAll('button, .clickable');
        
        interactiveElements.forEach(element => {
            element.addEventListener('touchstart', function() {
                this.style.opacity = '0.7';
            });
            
            element.addEventListener('touchend', function() {
                this.style.opacity = '1';
            });
            
            element.addEventListener('touchcancel', function() {
                this.style.opacity = '1';
            });
        });
    },
    
    // Handle orientation change
    handleOrientationChange() {
        if (this.isMobile) {
            // Adjust layout based on orientation
            const mobileQuickActions = document.getElementById('mobile-quick-actions');
            
            if (this.screenOrientation === 'landscape') {
                // Landscape optimizations
                if (mobileQuickActions) {
                    mobileQuickActions.style.padding = '5px';
                }
                
                // Adjust stats bar for landscape
                const statsBar = document.getElementById('stats-bar');
                if (statsBar) {
                    statsBar.style.fontSize = '10px';
                    statsBar.style.minHeight = '50px';
                }
            } else {
                // Portrait optimizations
                if (mobileQuickActions) {
                    mobileQuickActions.style.padding = '10px';
                }
                
                // Reset stats bar for portrait
                const statsBar = document.getElementById('stats-bar');
                if (statsBar) {
                    statsBar.style.fontSize = '';
                    statsBar.style.minHeight = '';
                }
            }
        }
        
        // Show orientation warning for very small screens in landscape
        if (this.isMobile && this.screenOrientation === 'landscape' && this.screenWidth < 600) {
            this.showOrientationSuggestion();
        } else {
            this.hideOrientationSuggestion();
        }
    },
    
    // Show orientation suggestion
    showOrientationSuggestion() {
        let orientationWarning = document.getElementById('orientation-warning');
        
        if (!orientationWarning) {
            orientationWarning = document.createElement('div');
            orientationWarning.id = 'orientation-warning';
            orientationWarning.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.95);
                color: white;
                padding: 20px;
                border-radius: 10px;
                text-align: center;
                z-index: 2000;
                max-width: 300px;
                border: 2px solid #c0a062;
                font-family: 'Georgia', serif;
            `;
            
            orientationWarning.innerHTML = `
                <h3 style="margin: 0 0 10px 0; color: #c0a062;">📱 Better Experience</h3>
                <p style="margin: 0 0 15px 0;">For the best experience, try rotating your device to portrait mode!</p>
                <button onclick="MobileSystem.hideOrientationSuggestion()" 
                        style="background: linear-gradient(45deg, #333, #000); color: #c0a062; border: 1px solid #c0a062; padding: 10px 20px; 
                               border-radius: 5px; cursor: pointer; font-weight: bold; font-family: 'Georgia', serif;">
                    Got it!
                </button>
            `;
            
            document.body.appendChild(orientationWarning);
        }
        
        orientationWarning.style.display = 'block';
    },
    
    // Hide orientation suggestion
    hideOrientationSuggestion() {
        const orientationWarning = document.getElementById('orientation-warning');
        if (orientationWarning) {
            orientationWarning.style.display = 'none';
        }
    },
    
    // Setup orientation handling
    setupOrientationHandling() {
        // Listen for orientation changes
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleOrientationChange();
            }, 100);
        });
    },
    
    // Optimize mobile interface
    optimizeMobileInterface() {
        // Adjust stats bar for mobile
        const statsBar = document.getElementById('stats-bar');
        if (statsBar && this.isMobile) {
            statsBar.style.flexWrap = 'wrap';
            statsBar.style.minHeight = '80px';
        }
        
        // Adjust game content margins for mobile quick actions
        const gameScreens = document.querySelectorAll('.game-screen, #menu');
        gameScreens.forEach(screen => {
            if (this.isMobile) {
                screen.style.marginBottom = '80px'; // Space for quick actions bar
                screen.style.paddingBottom = '20px';
            }
        });
        
        // Make menu grids single column on mobile
        const menuGrids = document.querySelectorAll('.menu-grid');
        menuGrids.forEach(grid => {
            if (this.isMobile) {
                grid.style.gridTemplateColumns = '1fr';
                grid.style.gap = '15px';
            }
        });
    },
    
    // Optimize for mobile (called once)
    optimizeForMobile() {
        if (this.isMobile || this.isTablet) {
            // Disable hover effects on touch devices
            const hoverStyles = document.createElement('style');
            hoverStyles.textContent = `
                @media (hover: none) {
                    button:hover,
                    .clickable:hover {
                        transform: none !important;
                        box-shadow: none !important;
                    }
                }
            `;
            document.head.appendChild(hoverStyles);
            
            // Optimize scrolling
            document.body.style.webkitOverflowScrolling = 'touch';
            
            // Prevent zoom on input focus
            const viewport = document.querySelector('meta[name="viewport"]');
            if (viewport) {
                viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
            } else {
                const newViewport = document.createElement('meta');
                newViewport.name = 'viewport';
                newViewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
                document.head.appendChild(newViewport);
            }
        }
    },
    
    // Get current device info
    getDeviceInfo() {
        return {
            isMobile: this.isMobile,
            isTablet: this.isTablet,
            orientation: this.screenOrientation,
            width: this.screenWidth,
            height: this.screenHeight,
            userAgent: navigator.userAgent
        };
    }
};

// Initialize mobile system when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    MobileSystem.init();
});

// Also initialize on window load as backup
window.addEventListener('load', function() {
    if (!MobileSystem.isMobile && !MobileSystem.isTablet) {
        MobileSystem.init();
    }
});

// Update mobile action log when actions are logged
function updateMobileActionLog() {
    if (MobileSystem.isMobile || MobileSystem.isTablet) {
        setTimeout(() => {
            MobileSystem.updateMobileActionLog();
        }, 100);
    }
}

// Export for global use
window.MobileSystem = MobileSystem;

console.log('Mobile Responsive System loaded');
