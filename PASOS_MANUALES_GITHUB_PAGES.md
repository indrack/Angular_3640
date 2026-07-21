# 🚀 Guía de Configuración Manual en GitHub Pages

Este documento contiene todos los datos y pasos manuales necesarios para poner tu proyecto **WOD-3640-TV** a funcionar de forma **100% gratuita** en GitHub Pages.

---

## 🛠️ Cambios ya aplicados automáticamente en el proyecto

1. **Rutas Angular (`src/app/app.config.ts`)**: Se activó `withHashLocation()` para que las rutas como `/admin` o el menú no den error 404 al recargar la página en GitHub Pages.
2. **GitHub Actions (`.github/workflows/deploy.yml`)**: Se creó el archivo de despliegue automático. Cada vez que hagas `git push` a la rama `main`, la app se compilará y se publicará en GitHub Pages automáticamente.
3. **Convertidor TXT a JSON**:
   - En el panel de **Staff / Admin**, ahora puedes pegar un texto `.txt` o subirlo directamente para que el sistema convierta automáticamente tus rutinas a formato JSON / Pantallas.
   - También cuentas con el script local `scripts/convert-wod-txt.js`.

---

## 📋 Pasos Manuales que Debes Hacer en GitHub

### 1. Activar GitHub Pages en el Repositorio

1. Ve a tu repositorio en GitHub: `https://github.com/<tu-usuario>/<tu-repositorio>`.
2. Haz clic en la pestaña **Settings** (Configuración) en el menú superior.
3. En el menú lateral izquierdo, haz clic en **Pages**.
4. En la sección **Build and deployment**:
   - Bajo **Source**, cambia la opción de `Deploy from a branch` a **`GitHub Actions`**.
5. ¡Listo! A partir de ese momento, el flujo automático `.github/workflows/deploy.yml` se encargará de publicar la app cada vez que subas cambios a `main`.

---

## 📄 ¿Cómo funciona la Automatización de Texto (.TXT) a JSON?

### Opción A: Desde el Panel de Administración de la App (Recomendado)
1. Entra a la ruta de administración `/admin` (o en la URL: `https://tu-usuario.github.io/tu-repo/#/admin`).
2. Inicia sesión con tus credenciales de Staff.
3. Selecciona la Sede (Calacoto / Miraflores) y haz clic en **AGREGAR SLIDE** o **LIMPIAR TODO**.
4. Haz clic en el botón azul **📄 Importar / Autoconvertir desde Texto (.TXT)**.
5. Pega el texto de tu WOD o sube el archivo `.txt`.
   - *Nota*: Separa cada pantalla con una línea en blanco (doble salto de línea). La primera línea de cada bloque se usará como el título de la pantalla.
6. Haz clic en **⚡ Convertir Texto a Pantallas** y presiona **☁️ PUBLICAR EN TV**.

### Opción B: Usando el script en la terminal (Offline)
Si deseas convertir un archivo `.txt` en tu computadora a formato JSON:
```bash
node scripts/convert-wod-txt.js mi_wod.txt
```
Esto generará un archivo `mi_wod_output.json` listo con la estructura `{ titulo, contenido }`.

---

## 🔗 URL Final de tu Sitio
Tu pantalla de WOD quedará disponible públicamente en:
`https://<tu-usuario>.github.io/<tu-repositorio>/`
