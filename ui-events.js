(function(){
  if (!window.EventBus) return; // safety

  function formatMoney(n){ try { return n.toLocaleString(); } catch { return String(n); } }

  function refreshMoneyDisplay() {
    const moneyEl = document.getElementById('money-display');
    if (!moneyEl) return;
    if (window.player && player.inJail) {
      moneyEl.innerText = `In Jail for ${player.jailTime} seconds`;
    } else {
      const dirty = (window.player && (player.dirtyMoney || 0)) || 0;
      const money = (window.player && player.money) || 0;
      moneyEl.innerText = `Money: $${formatMoney(money)} | Dirty: $${formatMoney(dirty)}`;
    }
  }

  EventBus.on('moneyChanged', ({ oldValue, newValue }) => {
    // Only update cash HUD when not in jail (jail handler takes precedence)
    if (window.player && player.inJail) return;
    refreshMoneyDisplay();
  });

  EventBus.on('wantedLevelChanged', ({ oldValue, newValue }) => {
    const el = document.getElementById('wanted-level-display');
    if (el) el.innerText = `Wanted Level: ${newValue}`;
  });

  EventBus.on('reputationChanged', ({ oldValue, newValue }) => {
    const el = document.getElementById('reputation-display');
    if (el) el.innerText = `Reputation: ${newValue}`;
  });

  EventBus.on('jailStatusChanged', ({ inJail, jailTime }) => {
    const jailStatus = document.getElementById('jail-status');
    if (jailStatus) jailStatus.innerText = inJail ? `${jailTime}s` : 'Free';
    refreshMoneyDisplay();
  });

  EventBus.on('jailTimeUpdated', ({ jailTime }) => {
    const jailStatus = document.getElementById('jail-status');
    if (jailStatus && window.player && player.inJail) jailStatus.innerText = `${jailTime}s`;
    // Keep top bar in sync while jailed
    if (window.player && player.inJail) refreshMoneyDisplay();
  });

  // Optional: initial paint if player already exists
  if (window.player) {
    refreshMoneyDisplay();
    const wanted = document.getElementById('wanted-level-display');
    if (wanted) wanted.innerText = `Wanted Level: ${player.wantedLevel}`;
  }
})();
