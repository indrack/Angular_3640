# 🏋️‍♂️ WOD-3640-TV

Sistema inteligente de sincronización y visualización de entrenamientos (WODs) en tiempo real, diseñado para televisores y pantallas de **CrossFit 3640** (Sedes Miraflores y Calacoto).

---

## 🌟 Características Principales

### 📺 1. Visualización Optimizada para Pantallas del Box
* **Orientación Vertical y Panorámica**: Interfaz adaptada específicamente para pantallas montadas en boxes de CrossFit.
* **Legibilidad de Alto Rendimiento**: Tipografía de gran tamaño con alto contraste, marcas de agua corporativas y títulos con iluminación neón.
* **Resaltado Inteligente**: Detección y formato automático de cargas (`60/42.5 kg`, `20/14 lbs`), esquemas de repeticiones (`21-15-9`), modalidades (`AMRAP`, `EMOM`, `SETS`) y soporte de Markdown (*negrita*, _subrayado_).
* **Reloj Digital y Estado en Vivo**: Header con fecha y hora en vivo de Bolivia e indicador visual de conectividad en tiempo real.

### ⚡ 2. Tiempo Real & Modo Offline
* **Sincronización Inalámbrica**: Conexión reactiva con Firebase Realtime Database para reflejar cambios en las pantallas al instante sin recargar la página.
* **Respaldo Local (Offline-First)**: Almacenamiento en caché local (`localStorage`) para que las pantallas sigan funcionando sin interrupciones incluso ante cortes de internet en el box.

### 🤖 3. Sincronización y Carga Automática Semanal
* **Automatización Programada**: Flujo continuo en GitHub Actions que sincroniza y carga de forma automática los WODs de la semana entrante cada domingo por la noche.
* **Tolerancia a Fallos y Detección de Descansos**: Manejo inteligente de sedes con respaldo automático y despliegue de estados limpios de descanso en feriados o cierres del box.
* **Ejecución Manual Bajo Demanda**: Posibilidad de forzar la actualización en cualquier momento mediante ejecución manual en un solo clic.

### 🛠️ 4. Panel de Administración para Staff y Coaches (`/#/admin`)
* **Gestión Multisede**: Edición independiente para Miraflores, Calacoto y WODs de la Semana (Rutina General y W-Girls).
* **Previsualizador `👁️ TV`**: Modal interactivo para simular el renderizado exacto en el televisor (cambio de pantallas, formato vertical/horizontal y estilos) antes de publicar.
* **Control Remoto Inalámbrico**: Control para avanzar, retroceder y maximizar pantallas en los boxes de forma remota.
* **Seguridad y Auditoría**: Control de acceso con roles (Super Admin, Weekly Admin, Celebration Admin) y registro de actividad en tiempo real.

---

## 🏗️ Arquitectura y Tecnologías

* **Frontend**: [Angular 21](https://angular.dev/) (Standalone Components, Signals, Zoneless Change Detection).
* **Estilos**: CSS3 moderno con efectos Glassmorphism, animaciones fluidas y variables de diseño responsivo.
* **Base de Datos & Auth**: Google Firebase Realtime Database y Firebase Authentication.
* **Automatización & CI/CD**: GitHub Actions (ejecución programada y compilación continua) y GitHub Pages.

---

## 🚀 Puesta en Marcha Local

### Prerrequisitos
* Node.js v20+ o v22+
* npm v10+

### Instalación y Ejecución
```bash
# 1. Clonar el repositorio
git clone https://github.com/indrack/Angular_3640.git
cd Angular_3640

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo local
npm start
```
Abre tu navegador en `http://localhost:4200/` para ver la pantalla de TV o en `http://localhost:4200/#/admin` para el panel de administración.

---

## 🧪 Pruebas Unitarias

El proyecto utiliza **Vitest** como motor de pruebas unitarias:
```bash
npm test
```

---

## 📄 Licencia
Desarrollado para uso exclusivo de **CrossFit 3640**. Todos los derechos reservados.
