# 📌 Reglas de Arquitectura y Funcionamiento: WOD-3640-TV

## 🏗️ 1. Arquitectura General del Proyecto
- **Framework**: Angular 21 (SPA - Single Page Application) sin backend server-side dedicado.
- **Base de Datos & Tiempo Real**: Google Firebase Realtime Database para la sincronización remota e inalámbrica de pantallas en TVs.
- **Modos de Operación**:
  - **Modo En Vivo (Firebase)**: Nodos `customWodMiraflores`, `customWodCalacoto` y `weeklyWods`. Se consumen en tiempo real si están disponibles.
  - **Modo Estático (Fallback)**: Archivos locales `src/app/core/data/wods.data.ts` y `wgirls.data.ts`. Sirven como respaldo offline o por defecto.

---

## 🚀 2. Despliegue en GitHub Pages (Gratuito)
- **Hosting**: GitHub Pages respaldado por el flujo de CI/CD en `.github/workflows/deploy.yml`.
- **Estrategia de Rutas (SPA)**: Se usa `withHashLocation()` en `app.config.ts` para evitar errores 404 al recargar subrutas (como `/#/admin`).
- **Configuración de Compilación**:
  - El comando de build debe incluir `--base-href /${{ github.event.repository.name }}/`.
  - Los presupuestos (*budgets*) en `angular.json` para el paquete inicial se mantienen elevados (hasta 4MB) para incluir el SDK de Firebase sin errores de compilación.

---

## 🔒 3. Seguridad y Variables de Entorno
- **Credenciales en GitHub (Repositorio Público)**:
  - `src/environments/environment.prod.ts` debe estar estrictamente incluido en `.gitignore`.
  - Las llaves de Firebase se inyectan en GitHub Actions durante la compilación a través de **GitHub Repository Secrets** (`FIREBASE_API_KEY`, `FIREBASE_PROJECT_ID`, etc.).
- **Reglas de Seguridad en Firebase Realtime Database**:
  - Lectura pública (`.read: true`) para que los televisores del box puedan descargar los WODs.
  - Escritura autenticada (`.write: "auth != null"`) para restringir las modificaciones únicamente a usuarios del Staff que hayan iniciado sesión en `/admin`.

---

## 📄 4. Gestión de WODs y Formatos de Texto (.TXT)
- **Formato Semanal Estándar**:
  ```text
  ------------------------Lunes---------------------------
  Warmup
  ...
  Gymnastics (Ring Dip) / Strength
  ...
  Custom Metcon (Tiempo) / WOD
  ...
  Accesorio / Finisher
  ...
  ```
- **Lógica de Bloques**:
  - Se admiten N cantidad de bloques por día (Warmup, Skill, Strength, Metcon, Accesorio, Finisher).
  - La interfaz de administración en `/admin` incluye la opción **`📅 WODS DE LA SEMANA`** con vista previa compacta por pestañas de días y distintivos de colores.
- **Herramientas de Conversión**:
  - **Vía Web**: Panel `/admin` -> `📄 Importar / Parsear Rutina Semanal (.TXT)`.
  - **Vía CLI**: `python3 scripts/update_wods.py <archivo.txt> [--wgirls]`.
