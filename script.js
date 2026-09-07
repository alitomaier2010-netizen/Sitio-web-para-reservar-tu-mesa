const hotspotsEl = document.getElementById("hotspots");
const infoMesaEl = document.getElementById("info-mesa");
const infoMesaContentEl = document.getElementById("infoMesaContent");

const formatoARS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

// tamaño relativo del número inspirado en las burbujas del mapa original:
// Platea/Escenario son las más grandes, VIP Burbuja/Ultra VIP/bloque central las más chicas.
const SECTOR_TAMANO = {
  Escenario: "lg",
  Platea: "lg",
  "VIP Suite": "md-lg",
  Corralito: "md",
  Gradas: "md",
  "Balcón Tincho": "md",
  "Balcón Canepa": "md",
  "VIP Burbuja": "sm",
  "Ultra VIP": "sm",
  VIP: "sm",
};

function renderHotspots() {
  hotspotsEl.innerHTML = "";
  MESAS.forEach((m) => {
    const btn = document.createElement("button");
    btn.className = `hotspot hotspot--${SECTOR_TAMANO[m.sector] || "md"}`;
    if (m.estado === "reservada") btn.classList.add("is-reservada");
    btn.style.left = `${m.x}%`;
    btn.style.top = `${m.y}%`;
    btn.textContent = m.id;
    btn.dataset.id = m.id;
    btn.setAttribute("aria-label", `Mesa ${m.id}`);
    btn.title = `Mesa ${m.id}`;

    btn.addEventListener("click", () => seleccionarMesa(m.id, btn));

    hotspotsEl.appendChild(btn);
  });
}

function seleccionarMesa(id, btn) {
  document
    .querySelectorAll(".hotspot.is-selected")
    .forEach((el) => el.classList.remove("is-selected"));
  btn.classList.add("is-selected");
  mostrarInfo(MESAS_BY_ID[id]);
  infoMesaEl.scrollIntoView({ behavior: "smooth", block: "start" });
}

function mostrarInfo(m) {
  const estadoLabel = m.estado === "reservada" ? "Reservada" : "Disponible";
  infoMesaContentEl.innerHTML = `
    <p class="mesa-info__sector">${m.sector}</p>
    <h2 class="mesa-info__titulo">
      Mesa ${m.id}
      <span class="mesa-info__estado mesa-info__estado--${m.estado}">${estadoLabel}</span>
    </h2>
    <div class="mesa-info__grid">
      <div class="mesa-info__dato">
        <span class="mesa-info__dato-label">Capacidad</span>
        <span class="mesa-info__dato-valor">${m.capacidad} personas</span>
      </div>
      <div class="mesa-info__dato">
        <span class="mesa-info__dato-label">Consumo mínimo</span>
        <span class="mesa-info__dato-valor">${formatoARS.format(m.consumo)}</span>
      </div>
      <div class="mesa-info__dato">
        <span class="mesa-info__dato-label">Precio de la mesa</span>
        <span class="mesa-info__dato-valor">${formatoARS.format(m.precio)}</span>
      </div>
    </div>
    <div class="mesa-info__publica">
      <p class="mesa-info__publica-label">Tu público a cargo</p>
      <p class="mesa-info__publica-nombre">${m.publica.nombre}</p>
      <a class="mesa-info__ig" href="https://instagram.com/${m.publica.instagram}" target="_blank" rel="noopener">
        📷 @${m.publica.instagram}
      </a>
    </div>
  `;
}

renderHotspots();
