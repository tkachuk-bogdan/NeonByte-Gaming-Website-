/* =========================================================
   Assignment #5: apply the saved Day / Night theme early.
   This tiny file is loaded in <head>, before the page is drawn,
   so a user who chose the Day theme never sees a dark "flash".
   The theme switch button itself lives in js/app.js.
   ========================================================= */
(function () {
  try {
    const savedTheme = localStorage.getItem('nb-theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      document.documentElement.setAttribute('data-bs-theme', savedTheme);
    }
  } catch (error) {
    // localStorage can be blocked (private mode) - keep the default dark theme
  }
})();
