// Portada: acceso opcional (login / registro / continuar sin cuenta).
// Si ya hay sesión, entra directo al menú y saluda con el nombre de la cuenta.

const $ = (id) => document.getElementById(id);

const accesoEl = $("acceso");
const cargandoEl = $("portadaCargando");
const menuEl = $("menuPrincipal");
const sesionEl = $("sesionInfo");
const saludoEl = $("saludo");
const btnSesionEl = $("btnSesion");
const avisoEl = $("accesoAviso");
const formLogin = $("formLogin");
const formRegistro = $("formRegistro");
const sponsorEl = $("sponsor");

let USUARIO = null;
let VISTA = "login";
let ultimoFoco = null;

// Recuerda que la persona eligió "continuar sin cuenta" para que, al volver
// desde el mapa a la portada, vea otra vez los 3 botones y no el login.
const INVITADO_KEY = "ns_invitado";

function marcarInvitado() {
  try { sessionStorage.setItem(INVITADO_KEY, "1"); } catch (e) {}
}

function limpiarInvitado() {
  try { sessionStorage.removeItem(INVITADO_KEY); } catch (e) {}
}

function esInvitado() {
  try { return sessionStorage.getItem(INVITADO_KEY) === "1"; } catch (e) { return false; }
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

function mostrarAviso(texto, tipo) {
  avisoEl.textContent = texto || "";
  avisoEl.className = "acceso__aviso" + (tipo ? ` acceso__aviso--${tipo}` : "");
  avisoEl.hidden = !texto;
}

function mostrarVista(vista) {
  VISTA = vista;
  const esLogin = vista === "login";
  formLogin.hidden = !esLogin;
  formRegistro.hidden = esLogin;

  $("tabLogin").classList.toggle("is-active", esLogin);
  $("tabRegistro").classList.toggle("is-active", !esLogin);
  $("tabLogin").setAttribute("aria-selected", esLogin ? "true" : "false");
  $("tabRegistro").setAttribute("aria-selected", esLogin ? "false" : "true");

  mostrarAviso("");
  (esLogin ? $("loginEmail") : $("regNombre")).focus();
}

function entrarAlSitio(usuario) {
  USUARIO = usuario || null;

  if (USUARIO) limpiarInvitado();
  else marcarInvitado();

  cargandoEl.hidden = true;
  accesoEl.hidden = true;
  menuEl.hidden = false;
  sesionEl.hidden = false;

  if (USUARIO) {
    saludoEl.innerHTML = `Hola, <strong>${esc(USUARIO.nombre_completo)}</strong>`;
    btnSesionEl.textContent = "Cerrar sesión";
  } else {
    saludoEl.textContent = "Estás navegando sin cuenta";
    btnSesionEl.textContent = "Iniciar sesión";
  }
}

function volverAlAcceso(mensaje) {
  USUARIO = null;
  limpiarInvitado();
  cargandoEl.hidden = true;
  menuEl.hidden = true;
  sesionEl.hidden = true;
  accesoEl.hidden = false;
  mostrarVista("login");
  mostrarAviso(mensaje || "", mensaje ? "ok" : "");
}

async function apiJson(url, opciones) {
  const r = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json" },
    ...opciones,
  });
  let d = {};
  try { d = await r.json(); } catch (e) {}
  if (!r.ok || !d.ok) {
    const err = new Error(d.error || `No se pudo completar (HTTP ${r.status})`);
    err.campo = d.campo || "";
    throw err;
  }
  return d;
}

function bloquear(boton, texto) {
  boton.dataset.texto = boton.textContent;
  boton.disabled = true;
  boton.textContent = texto;
}

function desbloquear(boton) {
  boton.disabled = false;
  if (boton.dataset.texto) boton.textContent = boton.dataset.texto;
}

// ---------- Mensaje patrocinador ----------

function abrirSponsor() {
  ultimoFoco = document.activeElement;
  sponsorEl.hidden = false;
  document.body.classList.add("sin-scroll");
  $("sponsorCerrar").focus();
}

function cerrarSponsor() {
  sponsorEl.hidden = true;
  document.body.classList.remove("sin-scroll");
  if (ultimoFoco && typeof ultimoFoco.focus === "function") ultimoFoco.focus();
}

$("sponsorCerrar").addEventListener("click", cerrarSponsor);
sponsorEl.addEventListener("click", (ev) => {
  if (ev.target === sponsorEl) cerrarSponsor();
});
document.addEventListener("keydown", (ev) => {
  if (ev.key === "Escape" && !sponsorEl.hidden) cerrarSponsor();
});

// ---------- Login / registro ----------

$("tabLogin").addEventListener("click", () => mostrarVista("login"));
$("tabRegistro").addEventListener("click", () => mostrarVista("registro"));

formLogin.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const email = $("loginEmail").value.trim();
  const password = $("loginPass").value;

  if (!email || !password) {
    mostrarAviso("Completá correo y contraseña.", "error");
    (!email ? $("loginEmail") : $("loginPass")).focus();
    return;
  }

  const boton = $("btnLogin");
  bloquear(boton, "Entrando...");
  try {
    const d = await apiJson("api/auth/login.php", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email, password }),
    });
    $("loginPass").value = "";
    entrarAlSitio(d.usuario);
  } catch (e) {
    mostrarAviso(e.message, "error");
    if (e.campo === "email") $("loginEmail").focus();
    else $("loginPass").focus();
  } finally {
    desbloquear(boton);
  }
});

formRegistro.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const nombre = $("regNombre").value.trim();
  const email = $("regEmail").value.trim();
  const password = $("regPass").value;

  if (nombre.length < 2) {
    mostrarAviso("Escribí tu nombre completo.", "error");
    $("regNombre").focus();
    return;
  }
  if (!email) {
    mostrarAviso("Escribí tu correo electrónico.", "error");
    $("regEmail").focus();
    return;
  }
  if (password.length < 8) {
    mostrarAviso("La contraseña tiene que tener al menos 8 caracteres.", "error");
    $("regPass").focus();
    return;
  }

  const boton = $("btnRegistro");
  bloquear(boton, "Creando cuenta...");
  try {
    const d = await apiJson("api/auth/registro.php", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ nombre_completo: nombre, email, password }),
    });
    $("regPass").value = "";
    entrarAlSitio(d.usuario);
  } catch (e) {
    mostrarAviso(e.message, "error");
    if (e.campo === "nombre_completo") $("regNombre").focus();
    else if (e.campo === "email") $("regEmail").focus();
    else if (e.campo === "password") $("regPass").focus();
  } finally {
    desbloquear(boton);
  }
});

$("btnSinCuenta").addEventListener("click", () => {
  entrarAlSitio(null);
  abrirSponsor();
});

btnSesionEl.addEventListener("click", async () => {
  if (!USUARIO) {
    volverAlAcceso();
    return;
  }

  btnSesionEl.disabled = true;
  try {
    await apiJson("api/auth/logout.php", {
      method: "POST",
      headers: { Accept: "application/json" },
    });
    formLogin.reset();
    formRegistro.reset();
    volverAlAcceso("Cerraste sesión. Podés volver a entrar cuando quieras.");
  } catch (e) {
    volverAlAcceso(`No se pudo cerrar la sesión: ${e.message}`);
  } finally {
    btnSesionEl.disabled = false;
  }
});

// ---------- Arranque ----------

(async function init() {
  try {
    const d = await apiJson("api/auth/sesion.php");
    if (d.autenticado && d.usuario) {
      entrarAlSitio(d.usuario);
      return;
    }
  } catch (e) {
    // Si la base no responde, la portada igual deja seguir sin cuenta.
  }
  // Si ya había elegido "continuar sin cuenta", vuelve directo a los 3 botones.
  if (esInvitado()) {
    entrarAlSitio(null);
    return;
  }
  cargandoEl.hidden = true;
  accesoEl.hidden = false;
  mostrarAviso("");
  $("loginEmail").focus();
})();
