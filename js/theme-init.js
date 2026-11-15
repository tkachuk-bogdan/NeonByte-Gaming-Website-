// applies the saved theme before the page is drawn
(function () {
  try {
    const savedTheme = localStorage.getItem('nb-theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      document.documentElement.setAttribute('data-bs-theme', savedTheme);
    }
  } catch (error) {
  }
})();
