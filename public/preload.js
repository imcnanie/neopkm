
  // Expose DarkReader to the webview's global window object
  window.DarkReader = require('darkreader');

  // Optionally enable DarkReader immediately in the main frame
  window.addEventListener('DOMContentLoaded', () => {
    window.DarkReader.enable({
      brightness: 100,
      contrast: 100,
      sepia: 10,
    });
  });


