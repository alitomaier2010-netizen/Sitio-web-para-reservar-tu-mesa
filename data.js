// Datos de ejemplo (placeholder). Reemplazá capacidad/consumo/precio/publica
// con la info real de cada mesa cuando la tengas.

// Posición de cada mesa como [x%, y%] sobre Mapas-limpio.jpg.
// Se puede recalibrar entrando en modo edición (botón ⚙) y pegando el JSON exportado.
const POSICIONES = {
  "1": [33.71, 19.96],
  "2": [39.21, 17.54],
  "3": [49.4, 16.91],
  "4": [59.32, 17.54],
  "5": [65.08, 19.96],
  "A": [28.35, 27.7],
  "B": [28.35, 30.74],
  "6": [38.47, 26.56],
  "7": [48.93, 26.56],
  "8": [53.62, 26.56],
  "9": [63.67, 26.56],
  "10": [68.36, 26.56],
  "11": [38.47, 30.86],
  "12": [48.93, 30.86],
  "13": [53.62, 30.86],
  "14": [63.67, 30.86],
  "15": [68.36, 30.86],
  "C": [71.51, 27.07],
  "D": [71.51, 31.21],
  "E": [71.51, 35.51],
  "F": [71.51, 39.61],
  "16": [39.75, 35.51],
  "17": [44.37, 35.51],
  "18": [49.06, 35.51],
  "19": [53.69, 35.51],
  "20": [58.38, 35.51],
  "21": [63.07, 35.51],
  "22": [37.87, 38.75],
  "23": [42.56, 38.71],
  "24": [47.25, 38.71],
  "25": [51.88, 38.75],
  "26": [56.57, 38.71],
  "27": [61.19, 38.71],
  "28": [65.75, 38.71],
  "29": [37.87, 40.98],
  "30": [42.56, 40.98],
  "31": [47.25, 40.98],
  "32": [51.88, 40.98],
  "33": [56.57, 40.98],
  "34": [61.19, 40.98],
  "35": [65.88, 40.98],
  "36": [39.75, 43.98],
  "37": [44.37, 43.98],
  "38": [48.99, 43.95],
  "39": [53.69, 43.95],
  "40": [58.38, 43.98],
  "41": [63.07, 43.98],
  "42": [72.39, 43.95],
  "43": [41.29, 46.84],
  "44": [51.01, 46.84],
  "45": [55.43, 46.84],
  "46": [64.95, 46.84],
  "47": [41.29, 49.1],
  "48": [51.01, 49.1],
  "49": [55.43, 49.1],
  "50": [64.95, 49.1],
  "51": [41.29, 51.29],
  "52": [51.01, 51.29],
  "53": [55.43, 51.29],
  "54": [64.95, 51.29],
  "55": [41.29, 53.55],
  "56": [51.01, 53.55],
  "57": [55.43, 53.55],
  "58": [64.95, 53.55],
  "59": [41.29, 55.74],
  "60": [51.01, 55.74],
  "61": [55.43, 55.74],
  "62": [64.95, 55.74],
  "63": [41.29, 58.01],
  "64": [51.01, 58.01],
  "65": [55.43, 58.01],
  "66": [64.95, 58.01],
  "67": [41.29, 60.2],
  "68": [51.01, 60.2],
  "69": [55.43, 60.2],
  "70": [64.95, 60.2],
  "71": [27.48, 49.53],
  "72": [27.48, 51.84],
  "73": [27.48, 54.14],
  "74": [27.48, 56.48],
  "75": [27.48, 58.83],
  "76": [27.48, 61.09],
  "77": [27.48, 63.44],
  "78": [72.65, 49.61],
  "79": [72.65, 51.88],
  "80": [72.65, 54.22],
  "81": [72.65, 56.52],
  "82": [72.65, 58.83],
  "83": [72.65, 61.17],
  "84": [72.65, 63.44],
  "85": [40.35, 69.26],
  "86": [45.17, 69.26],
  "87": [50.07, 69.26],
  "88": [55.09, 69.26],
  "89": [34.92, 71.33],
  "90": [47.72, 72.11],
  "91": [60.59, 71.33],
  "92": [34.85, 74.61],
  "93": [47.86, 75.39],
  "94": [60.59, 74.61],
  "95": [34.99, 77.85],
  "96": [44.64, 78.83],
  "97": [50.94, 78.83],
  "98": [60.72, 77.89],
  "C1": [32.98, 85.39],
  "C2": [37.94, 85.51],
  "C3": [42.9, 85.47],
  "C4": [47.86, 85.51],
  "C5": [52.68, 85.51],
  "C6": [57.64, 85.47],
  "C7": [62.6, 85.51],
  "C8": [67.56, 85.51],
};

const PUBLICA_UNICA = { nombre: "Aramis", instagram: "ara.nonstop" };

// helper para crear una mesa con valores por defecto segun sector
function mesa(id, sector, overrides = {}) {
  const defaults = {
    "Escenario": { capacidad: 10, consumo: 250000, precio: 300000 },
    "VIP Burbuja": { capacidad: 10, consumo: 300000, precio: 350000 },
    "Corralito": { capacidad: 6, consumo: 150000, precio: 180000 },
    "Gradas": { capacidad: 6, consumo: 150000, precio: 180000 },
    "Ultra VIP": { capacidad: 8, consumo: 220000, precio: 260000 },
    "VIP": { capacidad: 8, consumo: 180000, precio: 210000 },
    "Balcón Tincho": { capacidad: 6, consumo: 130000, precio: 160000 },
    "Balcón Canepa": { capacidad: 6, consumo: 130000, precio: 160000 },
    "VIP Suite": { capacidad: 10, consumo: 280000, precio: 320000 },
    "Platea": { capacidad: 4, consumo: 80000, precio: 100000 },
  };
  const base = defaults[sector] || { capacidad: 6, consumo: 100000, precio: 120000 };
  const [x, y] = POSICIONES[id] || [50, 50];
  return {
    id: String(id),
    sector,
    x,
    y,
    capacidad: base.capacidad,
    consumo: base.consumo,
    precio: base.precio,
    estado: "disponible", // "disponible" | "reservada"
    publica: PUBLICA_UNICA,
    ...overrides,
  };
}

const MESAS = [];

// --- Escenario (frente al escenario) ---
MESAS.push(mesa(1, "Escenario"), mesa(2, "Escenario"), mesa(3, "Escenario"), mesa(4, "Escenario"), mesa(5, "Escenario"));

// --- Corralito ---
MESAS.push(mesa("A", "Corralito"), mesa("B", "Corralito"));

// --- VIP Burbuja (2 filas x 5 columnas) ---
for (let id = 6; id <= 15; id++) MESAS.push(mesa(id, "VIP Burbuja"));

// --- Gradas ---
MESAS.push(mesa("C", "Gradas"), mesa("D", "Gradas"), mesa("E", "Gradas"), mesa("F", "Gradas"));

// --- Ultra VIP ---
for (let id = 16; id <= 42; id++) MESAS.push(mesa(id, "Ultra VIP"));

// --- Bloque central VIP (43-70) ---
for (let id = 43; id <= 70; id++) MESAS.push(mesa(id, "VIP"));

// --- Balcón Tincho ---
for (let id = 71; id <= 77; id++) MESAS.push(mesa(id, "Balcón Tincho"));

// --- Balcón Canepa ---
for (let id = 78; id <= 84; id++) MESAS.push(mesa(id, "Balcón Canepa"));

// --- VIP Suite (85-98) ---
for (let id = 85; id <= 98; id++) MESAS.push(mesa(id, "VIP Suite"));

// --- Platea (C1-C8) ---
for (let i = 1; i <= 8; i++) MESAS.push(mesa(`C${i}`, "Platea"));

// acceso rapido por id
const MESAS_BY_ID = Object.fromEntries(MESAS.map((m) => [m.id, m]));
