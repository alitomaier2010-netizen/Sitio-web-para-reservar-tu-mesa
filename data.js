// Datos de ejemplo (placeholder). Reemplazá capacidad/consumo/precio/publica
// con la info real de cada mesa cuando la tengas.

// Posición de cada mesa como [x%, y%] sobre Mesas-frente.jpg.
// Se puede recalibrar entrando en modo edición (botón ⚙) y pegando el JSON exportado.
const POSICIONES = {
  "1": [40.2, 27.71],
  "2": [43.4, 26.44],
  "3": [52.38, 25.83],
  "4": [60.35, 25.86],
  "5": [63.66, 27.08],
  "A": [38.02, 31.55],
  "B": [37.66, 33.77],
  "6": [46.26, 31.49],
  "9": [45.96, 32.47],
  "12": [45.85, 33.42],
  "15": [45.55, 34.4],
  "7": [52.71, 31.39],
  "10": [52.6, 32.35],
  "13": [52.48, 33.31],
  "Bls1": [52.28, 34.27],
  "8": [59.25, 31.28],
  "11": [59.14, 32.24],
  "14": [59.12, 33.19],
  "Bls2": [59.01, 34.15],
  "C": [67.19, 30.9],
  "D": [67.4, 32.84],
  "E": [67.59, 35.0],
  "F": [67.79, 37.21],
  "16": [43.17, 36.79],
  "17": [46.53, 36.76],
  "18": [50.08, 36.69],
  "19": [53.72, 36.61],
  "20": [57.27, 36.5],
  "21": [60.87, 36.48],
  "22": [42.78, 38.87],
  "23": [46.34, 38.85],
  "24": [49.9, 38.84],
  "25": [53.55, 38.82],
  "26": [57.2, 38.79],
  "27": [60.83, 38.65],
  "28": [63.73, 38.63],
  "29": [42.57, 40.31],
  "30": [46.04, 40.3],
  "31": [49.76, 40.16],
  "32": [53.5, 40.13],
  "33": [57.06, 40.11],
  "34": [60.81, 40.08],
  "35": [64.34, 39.95],
  "36": [42.32, 42.59],
  "37": [46.06, 42.56],
  "38": [49.7, 42.48],
  "39": [53.36, 42.51],
  "40": [57.09, 42.37],
  "41": [60.83, 42.34],
  "42": [68.49, 42.21],
  "43": [43.44, 44.7],
  "44": [50.74, 44.66],
  "45": [54.59, 44.68],
  "46": [61.69, 44.53],
  "47": [43.28, 45.93],
  "48": [50.6, 45.95],
  "49": [54.49, 45.97],
  "50": [61.57, 45.76],
  "51": [43.15, 47.28],
  "52": [50.54, 47.2],
  "53": [54.42, 47.19],
  "54": [61.56, 47.01],
  "55": [43.08, 48.5],
  "56": [50.49, 48.51],
  "57": [54.34, 48.59],
  "58": [61.51, 48.32],
  "59": [42.96, 49.79],
  "60": [50.45, 49.88],
  "61": [54.29, 49.87],
  "62": [61.47, 49.66],
  "63": [42.84, 51.07],
  "64": [50.24, 51.11],
  "65": [54.15, 51.19],
  "66": [61.42, 50.97],
  "67": [42.72, 52.36],
  "68": [50.15, 52.45],
  "69": [54.01, 52.54],
  "70": [61.32, 52.28],
  "71": [33.96, 44.07],
  "72": [33.54, 45.94],
  "73": [32.92, 47.77],
  "74": [32.52, 49.76],
  "75": [31.96, 51.88],
  "76": [31.48, 53.93],
  "77": [30.93, 56.11],
  "78": [68.93, 44.67],
  "79": [69.17, 46.56],
  "80": [69.32, 48.48],
  "81": [69.53, 50.48],
  "82": [69.7, 52.46],
  "83": [69.92, 54.52],
  "84": [70.02, 56.66],
  "85": [41.37, 58.46],
  "86": [46.06, 58.48],
  "87": [50.75, 58.5],
  "88": [55.44, 58.52],
  "89": [36.81, 60.21],
  "90": [45.98, 61.69],
  "91": [59.89, 60.35],
  "92": [36.32, 62.74],
  "93": [50.39, 61.73],
  "94": [59.88, 62.96],
  "95": [35.65, 65.34],
  "96": [45.72, 63.97],
  "97": [50.16, 64.13],
  "98": [59.9, 65.69],
  "C1": [31.71, 71.14],
  "C2": [36.51, 71.22],
  "C3": [41.39, 71.29],
  "C4": [46.28, 71.35],
  "C5": [51.16, 71.42],
  "C6": [56.15, 71.54],
  "C7": [61.14, 71.66],
  "C8": [66.02, 71.67],
};

const PUBLICAS = [
  { nombre: "Lucas", instagram: "lucas.nonstop" },
  { nombre: "Martina", instagram: "martina.nonstop" },
  { nombre: "Fede", instagram: "fede.nonstop" },
  { nombre: "Cami", instagram: "cami.nonstop" },
  { nombre: "Tomi", instagram: "tomi.nonstop" },
];

function publicaPara(id) {
  // asigna una publica de forma ciclica en base al id (placeholder)
  const seed = String(id)
    .split("")
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return PUBLICAS[seed % PUBLICAS.length];
}

// helper para crear una mesa con valores por defecto segun sector
function mesa(id, sector, overrides = {}) {
  const defaults = {
    "Escenario": { capacidad: 10, consumo: 250000, precio: 300000 },
    "VIP Burbuja": { capacidad: 10, consumo: 300000, precio: 350000 },
    "Corralito": { capacidad: 6, consumo: 150000, precio: 180000 },
    "Gradas": { capacidad: 6, consumo: 150000, precio: 180000 },
    "Ultra VIP": { capacidad: 8, consumo: 220000, precio: 260000 },
    "VIP": { capacidad: 8, consumo: 180000, precio: 210000 },
    "Balcón Laucha": { capacidad: 6, consumo: 130000, precio: 160000 },
    "Balcón": { capacidad: 6, consumo: 130000, precio: 160000 },
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
    publica: publicaPara(id),
    ...overrides,
  };
}

const MESAS = [];

// --- Escenario (frente al escenario) ---
MESAS.push(mesa(1, "Escenario"), mesa(2, "Escenario"), mesa(3, "Escenario"), mesa(4, "Escenario"), mesa(5, "Escenario"));

// --- Corralito ---
MESAS.push(mesa("A", "Corralito"), mesa("B", "Corralito"));

// --- VIP Burbuja ---
MESAS.push(
  mesa(6, "VIP Burbuja"), mesa(9, "VIP Burbuja"), mesa(12, "VIP Burbuja"), mesa(15, "VIP Burbuja"),
  mesa(7, "VIP Burbuja"), mesa(10, "VIP Burbuja"), mesa(13, "VIP Burbuja"), mesa("Bls1", "VIP Burbuja"),
  mesa(8, "VIP Burbuja"), mesa(11, "VIP Burbuja"), mesa(14, "VIP Burbuja"), mesa("Bls2", "VIP Burbuja")
);

// --- Gradas ---
MESAS.push(mesa("C", "Gradas"), mesa("D", "Gradas"), mesa("E", "Gradas"), mesa("F", "Gradas"));

// --- Ultra VIP ---
[16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42].forEach(
  (id) => MESAS.push(mesa(id, "Ultra VIP"))
);

// --- Bloque central VIP (43-70) ---
for (let id = 43; id <= 70; id++) MESAS.push(mesa(id, "VIP"));

// --- Balcón Laucha ---
[71, 72, 73, 74, 75, 76, 77].forEach((id) => MESAS.push(mesa(id, "Balcón Laucha")));

// --- Balcón ---
[78, 79, 80, 81, 82, 83, 84].forEach((id) => MESAS.push(mesa(id, "Balcón")));

// --- VIP Suite / zona pasillo (85-98) ---
for (let id = 85; id <= 98; id++) MESAS.push(mesa(id, "VIP Suite"));

// --- Platea (C1-C8) ---
for (let i = 1; i <= 8; i++) MESAS.push(mesa(`C${i}`, "Platea"));

// acceso rapido por id
const MESAS_BY_ID = Object.fromEntries(MESAS.map((m) => [m.id, m]));
