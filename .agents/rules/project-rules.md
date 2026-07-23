---
trigger: always_on
glob: "*"
description: Reglas de arquitectura, despliegue en GitHub Pages y funcionamiento de WOD-3640-TV
---

# 📌 Reglas del Proyecto: WOD-3640-TV

## 1. Arquitectura del Proyecto
- **Frontend**: Angular 21 Single Page Application (SPA).
- **Backend & Base de Datos**: Firebase Realtime Database.
- **Sincronización de WODs**:
  - `customWodMiraflores` y `customWodCalacoto` para WODs personalizados por sede.
  - `weeklyWods` para la rutina semanal general.
  - Fallback local a `wods.data.ts` y `wgirls.data.ts` si no hay conexión a Firebase.

## 2. Reglas de Despliegue (GitHub Pages Gratuito)
- **Rutas**: Se requiere `withHashLocation()` en `app.config.ts`.
- **Secrets**: `environment.prod.ts` NO se commitea a Git (está en `.gitignore`). Las variables se inyectan en GitHub Actions via Secrets.
- **Build Budgets**: `angular.json` mantiene presupuestos de compilación de 4MB para alojar Firebase SDK.

## 3. Manejo de WODs y Texto (.TXT)
- El delimitador estándar para rutinas semanales es `------------------------[Día]---------------------------`.
- Se admiten bloques dinámicos: Warmup, Skill, Strength, Metcon, Accesorio, Finisher.
- En `/admin`, la opción **📅 WODS DE LA SEMANA** permite previsualizar y publicar directamente a Firebase sin requerir git commit.
