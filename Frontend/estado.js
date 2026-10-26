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
    <img class="db-badge__logo" src="xampp-logo.svg" alt="" aria-hidden="true" />
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
