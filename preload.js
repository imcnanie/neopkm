// preload.js
window.addEventListener('DOMContentLoaded', () => {
  const DarkReader = require('darkreader');

  DarkReader.enable({
    brightness: 50,
    contrast: 100,
    sepia: 10,
  });
});
