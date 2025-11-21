(function(){
  const listeners = new Map(); // eventName => Set<handler>

  function on(eventName, handler) {
    if (!listeners.has(eventName)) listeners.set(eventName, new Set());
    listeners.get(eventName).add(handler);
    return () => off(eventName, handler);
  }

  function off(eventName, handler) {
    const set = listeners.get(eventName);
    if (set) {
      set.delete(handler);
      if (set.size === 0) listeners.delete(eventName);
    }
  }

  function emit(eventName, payload) {
    const set = listeners.get(eventName);
    if (!set || set.size === 0) return;
    // Copy to guard against mutations during iteration
    [...set].forEach(fn => {
      try { fn(payload); } catch (e) { console.warn('EventBus handler error for', eventName, e); }
    });
  }

  window.EventBus = { on, off, emit };
})();
