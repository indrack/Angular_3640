# 🚀 Guía de Configuración Manual en GitHub Pages y Secretos

Este documento contiene todos los datos y pasos manuales necesarios para poner tu proyecto **WOD-3640-TV** a funcionar de forma **100% gratuita** en GitHub Pages protegiendo tus credenciales de Firebase.

---

## 🔒 1. Configurar Secretos de Firebase en GitHub (Repositorio Público)

Dado que tu repositorio en GitHub es **PÚBLICO**, hemos protegido el código para que las credenciales de Firebase **NO queden visibles en tu historial de Git**.

Para que la compilación en GitHub Actions funcione, debes agregar tus secretos en GitHub:

1. Ve a tu repositorio en GitHub: `https://github.com/<tu-usuario>/<tu-repositorio>`.
2. Haz clic en **Settings** (Configuración).
3. En el menú lateral izquierdo, ve a **Secrets and variables** > **Actions**.
4. Haz clic en el botón verde **New repository secret** y agrega cada uno de los siguientes 7 secretos:

| Secret Name (Nombre del Secreto) | Value (Valor Exacto) |
|---|---|
| `FIREBASE_API_KEY` | `AIzaSyCC3idHLHcFFcGOAbdJGtuWYsrV0PFf8Oc` |
| `FIREBASE_AUTH_DOMAIN` | `crosssfit--3640-tv.firebaseapp.com` |
| `FIREBASE_DATABASE_URL` | `https://crosssfit--3640-tv-default-rtdb.firebaseio.com` |
| `FIREBASE_PROJECT_ID` | `crosssfit--3640-tv` |
| `FIREBASE_STORAGE_BUCKET` | `crosssfit--3640-tv.firebasestorage.app` |
| `FIREBASE_MESSAGING_SENDER_ID` | `908256000888` |
| `FIREBASE_APP_ID` | `1:908256000888:web:09e4bffb19519b8784668d` |

---

## ⚙️ 2. Activar GitHub Pages en el Repositorio

1. En la pestaña **Settings** > **Pages** de tu repositorio.
2. En **Source**, asegúrate de tener seleccionado **`GitHub Actions`**.
3. ¡Listo! El flujo `.github/workflows/deploy.yml` inyectará los secretos y compilará la app de forma totalmente segura.

---

## 📄 3. ¿Cómo automatizar tus WODs semanales (.txt)?

### Desde la Terminal (Script Python)
```bash
# Para actualizar WODs normales (wods.data.ts)
python3 scripts/update_wods.py tu_rutina_semanal.txt

# Para actualizar WGIRLS (wgirls.data.ts)
python3 scripts/update_wods.py tu_rutina_semanal.txt --wgirls
```

### Desde el Panel de Administración de la App (/admin)
1. Entra a `/admin` e inicia sesión.
2. Haz clic en **📄 Importar / Autoconvertir desde Texto (.TXT)**.
3. Pega tu texto semanal con separadores `------------------------[Día]---------------------------`.
4. Haz clic en **⚡ Convertir Texto a Pantallas** y **☁️ PUBLICAR EN TV**.

---

## 🔗 URL Final de tu Sitio
`https://<tu-usuario>.github.io/<tu-repositorio>/`
