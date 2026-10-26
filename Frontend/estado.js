// Badge XAMPP: indica si MySQL responde. Reemplaza los viejos mensajes de
// "conectando / modo offline". Se agrega solo en todas las páginas.
(function () {
  "use strict";

  const INTERVALO_MS = 30000;

  const badge = document.createElement("div");
  badge.className = "db-badge db-badge--chequeando";
  badge.id = "dbBadge";
  badge.setAttribute("role", "status");
  badge.setAttribute("aria-live", "polite");
  badge.setAttribute("aria-label", "Chequeando conexión con MySQL");
  badge.title = "Chequeando conexión con MySQL";

  badge.innerHTML = `
    <svg class="db-badge__logo" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <rect x="1.5" y="1.5" width="61" height="61" rx="12" fill="#f7f7fb" stroke="#d8d8e2" stroke-width="3"/>
      <text x="32" y="34" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
            font-size="13" font-weight="700" letter-spacing="0.2">
        <tspan fill="#fb7f2b">X</tspan><tspan fill="#20202c">AMPP</tspan>
      </text>
      <text x="32" y="46" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
            font-size="6" font-weight="700" letter-spacing="0.4" fill="#7c7c8c">LOCAL</text>
    </svg>
    <span class="db-badge__mark" aria-hidden="true"></span>
  `;

  document.body.appendChild(badge);

  const mark = badge.querySelector(".db-badge__mark");
  let timer = null;

  function pintar(estado) {
    badge.classList.remove("db-badge--chequeando", "db-badge--ok", "db-badge--off");
    if (estado === true) {
      badge.classList.add("db-badge--ok");
      mark.textContent = "✓";
      badge.setAttribute("aria-label", "MySQL conectado");
      badge.title = "MySQL conectado";
    } else if (estado === false) {
      badge.classList.add("db-badge--off");
      mark.textContent = "✕";
      badge.setAttribute("aria-label", "MySQL desconectado");
      badge.title = "MySQL desconectado";
    } else {
      badge.classList.add("db-badge--chequeando");
      mark.textContent = "…";
      badge.setAttribute("aria-label", "Chequeando conexión con MySQL");
      badge.title = "Chequeando conexión con MySQL";
    }
  }

  async function chequear() {
    try {
      const r = await fetch("api/estado.php", {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      let d = {};
      try { d = await r.json(); } catch (e) {}
      pintar(r.ok && d.ok === true && d.db === true);
    } catch (e) {
      pintar(false);
    } finally {
      clearTimeout(timer);
      timer = setTimeout(chequear, INTERVALO_MS);
    }
  }

  // Al volver a la pestaña, refrescamos enseguida.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      clearTimeout(timer);
      chequear();
    }
  });

  chequear();
})();
