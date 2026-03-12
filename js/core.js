/**
 * TACTICAL FITNESS — core.js v14
 * Backward-compatible loader: schema + storage are loaded separately in v14
 * Pages that load core.js still work because Schema and Storage
 * are now available as separate files.
 *
 * Load order in pages:
 *   event-bus.js → game-state.js → schema.js → storage.js → core.js → engines
 */
'use strict';

// core.js is now a thin shim.
// Schema and Storage are defined in schema.js and storage.js respectively.
// This file exists for backward compatibility with pages that load ../js/core.js

if (typeof Schema === 'undefined' || typeof Storage === 'undefined') {
  console.warn('[core.js] Schema or Storage not loaded before core.js — check script order');
}
