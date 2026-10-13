// Portada: solo chequea que el backend este vivo para mostrar el estado.
// Las tres opciones son enlaces, asi que no hace falta logica de negocio aca.

const statusEl = document.getElementById("apiStatus");

async function checkApi() {
  try {
    const r = await fetch("api/fechas.php", { headers: { Accept: "application/json" } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const d = await r.json();
    if (!statusEl) return;
    statusEl.textContent = "Reservas y consumos en vivo";
    statusEl.className = "api-status api-status--ok portada__status";
  } catch (e) {
    if (!statusEl) return;
    statusEl.textContent = "Modo offline: la carta y las reservas no se pueden guardar";
    statusEl.className = "api-status api-status--off portada__status";
  }
}

checkApi();