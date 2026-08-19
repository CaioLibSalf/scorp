// Lógica compartilhada por todas as páginas: ano do rodapé, link ativo do
// menu e alternância de tema. Antes esse mesmo código existia copiado em
// cada página HTML; agora vive em um único lugar.
(function () {
  function setFooterYear() {
    var y = document.getElementById('y');
    if (y) y.textContent = new Date().getFullYear();
  }

  function setActiveNavLink() {
    var map = {
      '/': 'nav-inicio',
      '/index.html': 'nav-inicio',
      '/sobre.html': 'nav-sobre',
      '/convite.html': 'nav-convite',
      '/politica.html': 'nav-priv',
      '/leaderboard.html': 'nav-leader',
      '/contato.html': 'nav-contato'
    };
    var id = map[location.pathname];
    if (!id) return;
    document.querySelectorAll('#' + id).forEach(function (el) {
      el.classList.add('active');
    });
  }

  function setupThemeToggle() {
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;
    var root = document.documentElement;

    // O tema já foi aplicado por um script inline no <head> (evita flash).
    btn.setAttribute('aria-pressed', root.classList.contains('dark') ? 'true' : 'false');

    btn.addEventListener('click', function () {
      var nowDark = root.classList.toggle('dark');
      localStorage.setItem('theme', nowDark ? 'dark' : 'light');
      root.style.colorScheme = nowDark ? 'dark' : 'light';
      btn.setAttribute('aria-pressed', nowDark ? 'true' : 'false');
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    setFooterYear();
    setActiveNavLink();
    setupThemeToggle();
  });
})();
