// guard.js — pare-chocs global
window.addEventListener('error', (e) => console.error('[GLOBAL ERROR]', e.message, e.filename, e.lineno));
window.addEventListener('unhandledrejection', (e) => console.error('[UNHANDLED PROMISE]', e.reason));
console.log('[GUARD] chargé ✅');
