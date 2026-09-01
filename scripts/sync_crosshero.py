#!/usr/bin/env python3
"""
Agente Extractor Autónomo de WODs desde CrossHero.
Inicia sesión en CrossHero (usando password_mode=1 para evitar el PIN),
extrae los WODs de los 7 días de la semana para Miraflores y Calacoto,
fusiona los bloques si alguna sede está vacía, y opcionalmente publica a Firebase.

Uso:
  python3 scripts/sync_crosshero.py [--dry-run] [--publish] [--target-week current|next]
"""

import os
import sys
import argparse
import datetime
import urllib.parse
import re
import json
import time

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    sync_playwright = None

# Identificadores estáticos de CrossHero para CrossFit 3640
PROGRAM_MIRAFLORES = "63484ed97c70ac0031380c9e"
PROGRAM_CALACOTO   = "6344b19c159f420031c6c3b4"

DAY_KEYS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
SPANISH_DAY_ABBR = {
    0: 'Lun',
    1: 'Mar',
    2: 'Mie',
    3: 'Jue',
    4: 'Vie',
    5: 'Sab',
    6: 'Dom'
}

def get_target_week_dates(target_week="next"):
    """
    Calcula las 7 fechas (Lunes a Domingo) para la semana solicitada.
    target_week: 'current' (semana actual) o 'next' (semana entrante).
    Retorna lista de tuplas: (day_key, formatted_date_for_crosshero, iso_date)
    Ejemplo formatted_date_for_crosshero: 'Lun 31/08/2026'
    """
    today = datetime.date.today()
    # today.weekday(): 0 = Lunes, 6 = Domingo
    current_monday = today - datetime.timedelta(days=today.weekday())

    if target_week == "next":
        target_monday = current_monday + datetime.timedelta(days=7)
    else:
        target_monday = current_monday

    week_dates = []
    for offset in range(7):
        d = target_monday + datetime.timedelta(days=offset)
        day_key = DAY_KEYS[offset]
        abbr = SPANISH_DAY_ABBR[offset]
        formatted = f"{abbr} {d.strftime('%d/%m/%Y')}"
        week_dates.append({
            'day_key': day_key,
            'abbr': abbr,
            'crosshero_date': formatted,
            'date_obj': d,
            'iso_date': d.strftime('%Y-%m-%d')
        })

    return week_dates

def clean_title(title):
    if not title:
        return title
    # Quitar "(Tiempo)" o "(tiempo)" pero conservar "(Peso)" u otros
    return re.sub(r'\s*\([Tt]iempo\)', '', title).strip()

def format_wod_content(content):
    if not content:
        return content

    raw_lines = content.split('\n')
    cleaned_lines = []

    # 1. Deduplicación de 'For time' consecutivos
    for line in raw_lines:
        trimmed = line.strip()
        is_for_time = bool(re.match(r'^\*?\s*for time:?\s*\*?$', trimmed, re.IGNORECASE))
        if is_for_time and cleaned_lines:
            prev_trimmed = cleaned_lines[-1].strip()
            if re.match(r'^\*?\s*for time:?\s*\*?$', prev_trimmed, re.IGNORECASE):
                continue
        cleaned_lines.append(line)

    # Regex para líneas completas que deben ir en *...*
    full_line_patterns = [
        # Sets y Rounds
        r'^\d+\s*(?:SETS?|ROUNDS?|Rounds?|Sets?)(?:\s*(?:of|for quality of|for time of|each))?:?$',
        r'^\d+\s*ROUND\s*EACH$',
        r'^EMOM\s*x?\s*[\d:]+.*$',
        r'^AMRAP\s*[\d:]+.*$',
        # Tiempos, Clocks y Caps
        r'^(?:For time:?|FOR TIME:?)$',
        r'^Time cap:?\s*[\d:]+\s*(?:mins?|min|m|horas?|hrs?)?\.?$',
        r'^ON A\s+[\d:]+\s+CLOCK.*$',
        r'^Every\s+[\d:]+\s+(?:mins?\s+)?for\s+[\d:]+\s+mins?\.?$',
        r'^Rest\s+\d+\s*(?:mins?|min|seg|s)\.?$',
        r'^Into\.{2,3}:?$',
        # Equipos y directivas
        r'^(?:IN\s+)?TEAMS?\s+OF\s+\d+.*$',
        r'^Complete in teams of \d+\.?$',
        r'^Complete as-?$',
        # Instrucciones de coaches
        r'^Athletes have\s+[\d:]+\s+at each station.*$',
        r'^All\s+\d+\s+reps unbroken.*$'
    ]
    full_line_regex = re.compile('|'.join(f'(?:{p})' for p in full_line_patterns), re.IGNORECASE)

    # Prefix patterns: Minute 1:, Partner 1:
    minute_partner_regex = re.compile(r'^(\s*(?:Minute|Minuto|Partner|P)\s+\d+:?)(.*)$', re.IGNORECASE)

    formatted_lines = []

    for line in cleaned_lines:
        trimmed = line.strip()
        if not trimmed:
            formatted_lines.append(line)
            continue

        # Si ya está completamente envuelto en asteriscos, no tocar
        if trimmed.startswith('*') and trimmed.endswith('*') and len(trimmed) > 2:
            formatted_lines.append(line)
            continue

        # Verificar si coincide con patrón de prefijo (Minute 1:, Partner 1:)
        mp_match = minute_partner_regex.match(line)
        if mp_match:
            prefix, rest = mp_match.groups()
            if not prefix.strip().startswith('*'):
                formatted_lines.append(f"*{prefix.strip()}*{rest}")
                continue

        # Verificar si coincide con patrón de línea completa
        if full_line_regex.match(trimmed):
            leading_spaces = len(line) - len(line.lstrip())
            formatted_lines.append(f"{' ' * leading_spaces}*{trimmed}*")
        else:
            formatted_lines.append(line)

    return '\n'.join(formatted_lines)

def parse_card_text_to_blocks(raw_text):
    """
    Convierte el texto de la tarjeta de WOD de CrossHero en una lista de bloques:
    [{'titulo': 'Warmup', 'contenido': '...'}, ...]
    """
    if not raw_text or not raw_text.strip():
        return []

    lines = raw_text.strip().split('\n')
    header_regex = re.compile(
        r'^(Warmup|WARM-UP|Gymnastics|Custom Metcon|Weightlifting|Accesorio|OPTIONAL ACCESSORY|Strength|Skill|Finisher|Metcon)(\s*\(.*?\))?$',
        re.IGNORECASE
    )

    blocks = []
    current_title = None
    current_lines = []

    for line in lines:
        trimmed = line.strip()
        if not trimmed:
            continue

        # Ignorar encabezados de fecha como "31 DE AGOSTO DE 2026"
        if re.search(r'\b(DE\s+\w+\s+DE\s+\d{4})\b', trimmed, re.IGNORECASE):
            continue

        if header_regex.match(trimmed):
            if current_title:
                blocks.append({
                    'titulo': clean_title(current_title),
                    'contenido': format_wod_content('\n'.join(current_lines).strip())
                })
                current_lines = []
            current_title = trimmed
        else:
            if current_title:
                current_lines.append(trimmed)
            else:
                # Si hay texto antes de un título conocido, iniciamos con 'Warmup' o 'WOD'
                current_title = 'WOD'
                current_lines.append(trimmed)

    if current_title and current_lines:
        blocks.append({
            'titulo': clean_title(current_title),
            'contenido': format_wod_content('\n'.join(current_lines).strip())
        })

    return blocks

def dismiss_cookie_banners(page):
    """
    Descarta el aviso de cookies presionando 'Rechazar' para evitar telemetría,
    cookies no esenciales y minimizar el rastro del bot.
    """
    try:
        reject_btn = page.locator('button:has-text("Rechazar"), a:has-text("Rechazar"), input[value="Rechazar"]')
        if reject_btn.count() > 0 and reject_btn.first.is_visible():
            reject_btn.first.click()
            page.wait_for_timeout(400)
            return

        # Fallback vía DOM si el botón requiere trigger manual
        page.evaluate("""() => {
            const buttons = Array.from(document.querySelectorAll('button, a'));
            for (const b of buttons) {
                const text = (b.innerText || '').toLowerCase().trim();
                if (text === 'rechazar' || text.includes('rechazar')) {
                    b.click();
                    return;
                }
            }
            // Ocultar cualquier contenedor restante
            const cookieContainers = document.querySelectorAll('.cookie-consent, #onetrust-banner-sdk, .cc-window, [id*="cookie"], [class*="cookie"], div[class*="consent"]');
            cookieContainers.forEach(el => el.style.display = 'none');
        }""")
        page.wait_for_timeout(300)
    except Exception:
        pass

def extract_wod_from_page(page):
    """
    Extrae el texto del panel del WOD en la página de CrossHero classes.
    """
    try:
        dismiss_cookie_banners(page)
        page.wait_for_timeout(1000)

        wod_text = page.evaluate("""() => {
            // 1. Buscar tarjetas que contengan palabras claves de CrossFit
            const allElements = Array.from(document.querySelectorAll('div, section, article'));
            for (const el of allElements) {
                // Verificar que sea una tarjeta individual y no todo el body
                if (el.children.length > 1 && el.children.length < 30 && el.offsetHeight > 80 && el.offsetWidth < 800) {
                    const text = el.innerText || '';
                    if ((text.includes('Warmup') || text.includes('Metcon') || text.includes('Weightlifting')) &&
                        !text.includes('RESERVAR CLASE') && !text.includes('Ningún horario seleccionado')) {
                        return text;
                    }
                }
            }

            // 2. Fallback: buscar por selector de columnas de Bootstrap comunes
            for (const col of document.querySelectorAll('.col-md-6, .col-lg-6, .col-sm-12, .card-body')) {
                const t = col.innerText || '';
                if ((t.includes('Warmup') || t.includes('Metcon') || t.includes('Weightlifting')) && !t.includes('RESERVAS')) {
                    return t;
                }
            }

            return '';
        }""")

        return wod_text.strip()
    except Exception as e:
        print(f"   ⚠️ Advertencia al extraer texto de la página: {e}")
        return ""

def run_sync(email, password, target_week="next", dry_run=True, publish_firebase=False, screenshots_dir="artifacts/screenshots"):
    if not sync_playwright:
        print("❌ Error: Playwright no está instalado. Ejecuta: pip install playwright && playwright install chromium")
        sys.exit(1)

    os.makedirs(screenshots_dir, exist_ok=True)
    target_dates = get_target_week_dates(target_week)

    print("=" * 65)
    print(f"🤖 INICIANDO AGENTE EXTRACTOR CROSSHERO -> WOD-3640-TV")
    print(f"📅 Semana objetivo: {target_week.upper()} ({target_dates[0]['iso_date']} al {target_dates[-1]['iso_date']})")
    print(f"⚙️ Modo: {'[DRY-RUN / PRUEBAS]' if dry_run else '[PRODUCCIÓN]'}")
    print("=" * 65)

    weekly_result = {
        'domingo': [],
        'lunes': [],
        'martes': [],
        'miercoles': [],
        'jueves': [],
        'viernes': [],
        'sabado': []
    }

    with sync_playwright() as p:
        print("🌐 Lanzando navegador Chromium...")
        browser = p.chromium.launch(
            headless=True,
            args=[
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-blink-features=AutomationControlled'
            ]
        )
        context = browser.new_context(
            viewport={'width': 1280, 'height': 800},
            user_agent='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
        )
        page = context.new_page()

        # -----------------------------------------------------------------
        # PASO 1: LOGIN CON password_mode=1
        # -----------------------------------------------------------------
        encoded_email = urllib.parse.quote(email)
        login_url = f"https://crosshero.com/athletes/sign_in?athlete%5Bemail%5D={encoded_email}&password_mode=1"
        print(f"\n🔑 [1/3] Navegando a login con contraseña directa...")
        page.goto(login_url, wait_until="networkidle", timeout=30000)

        # Verificar si hay campo de contraseña
        pw_input = page.locator('input[type="password"]')
        if pw_input.count() == 0:
            print("⚠️ No se detectó input de contraseña directamente, intentando buscar botón 'Usar contraseña'...")
            use_pw_btn = page.locator('text="Usar contraseña"')
            if use_pw_btn.count() > 0:
                use_pw_btn.click()
                page.wait_for_timeout(1000)

        # Rellenar credenciales
        pw_input = page.locator('input[type="password"]')
        if pw_input.count() > 0:
            print("✍️ Rellenando contraseña...")
            pw_input.first.fill(password)
            page.wait_for_timeout(500)

            print("🔘 Haciendo clic en 'Iniciar sesión'...")
            submit_btn = page.locator('button:has-text("Iniciar sesión"), input[type="submit"][value="Iniciar sesión"]')
            if submit_btn.count() > 0:
                submit_btn.first.click()
            else:
                pw_input.first.press("Enter")

            page.wait_for_load_state("networkidle", timeout=30000)
            page.wait_for_timeout(2000)

        # Captura de pantalla del estado tras el login
        login_screenshot_path = os.path.join(screenshots_dir, "01_login_result.png")
        page.screenshot(path=login_screenshot_path)
        print(f"📸 Captura de login guardada en: {login_screenshot_path}")

        current_url = page.url
        print(f"📍 URL actual tras login: {current_url}")
        if "sign_in" in current_url:
            print("❌ El login no redirigió correctamente. Revisa la captura '01_login_result.png'.")
            browser.close()
            sys.exit(1)
        else:
            print("✅ Login exitoso verificado.")

        # -----------------------------------------------------------------
        # PASO 2: EXTRAER DÍAS DE LA SEMANA (MIRAFLORES + CALACOTO FALLBACK)
        # -----------------------------------------------------------------
        print(f"\n📥 [2/3] Extrayendo los 7 días de la semana...")

        for idx, day_info in enumerate(target_dates):
            day_key = day_info['day_key']
            crosshero_date = day_info['crosshero_date']
            encoded_date = urllib.parse.quote(crosshero_date)

            print(f"\n--- 🗓️ Día {idx + 1}/7: {day_key.upper()} ({crosshero_date}) ---")

            # 1. Intentar sede Miraflores
            url_mira = f"https://crosshero.com/dashboard/classes?date={encoded_date}&program_id={PROGRAM_MIRAFLORES}"
            print(f"   🏢 Consultando Miraflores...")
            page.goto(url_mira, wait_until="networkidle", timeout=25000)
            dismiss_cookie_banners(page)

            day_screenshot = os.path.join(screenshots_dir, f"day_{idx+1}_{day_key}_miraflores.png")
            page.screenshot(path=day_screenshot)

            raw_wod = extract_wod_from_page(page)
            blocks = parse_card_text_to_blocks(raw_wod)

            # 2. Si Miraflores está vacío, intentar Calacoto (Fallback anti-olvido)
            if not blocks:
                print(f"   ⚠️ Miraflores sin WOD cargado. Consultando Calacoto como respaldo...")
                url_cala = f"https://crosshero.com/dashboard/classes?date={encoded_date}&program_id={PROGRAM_CALACOTO}"
                page.goto(url_cala, wait_until="networkidle", timeout=25000)
                dismiss_cookie_banners(page)

                day_screenshot_cala = os.path.join(screenshots_dir, f"day_{idx+1}_{day_key}_calacoto.png")
                page.screenshot(path=day_screenshot_cala)

                raw_wod_cala = extract_wod_from_page(page)
                blocks = parse_card_text_to_blocks(raw_wod_cala)
                if blocks:
                    print(f"   ✅ ¡Se recuperó el WOD desde Calacoto ({len(blocks)} bloques encontrados)!")
            else:
                print(f"   ✅ Miraflores: {len(blocks)} bloques encontrados.")

            if blocks:
                weekly_result[day_key] = blocks
                for b in blocks:
                    print(f"      🔹 [{b['titulo']}] ({len(b['contenido'])} caracteres)")
            else:
                print(f"      ⚪ Sin ejercicios programados (Descanso / Pendiente).")
                weekly_result[day_key] = [{
                    'titulo': 'DESCANSO',
                    'contenido': 'Box Cerrado / Open Box'
                }]

        browser.close()

    # -----------------------------------------------------------------
    # PASO 3: GUARDAR ARTEFACTOS Y PUBLICAR
    # -----------------------------------------------------------------
    output_json_path = "extracted_wods.json"
    with open(output_json_path, 'w', encoding='utf-8') as f:
        json.dump(weekly_result, f, ensure_ascii=False, indent=2)

    print("\n" + "=" * 65)
    print(f"🎉 EXTRACCIÓN FINALIZADA CON ÉXITO")
    print(f"📁 JSON estructurado guardado en: {output_json_path}")
    print("=" * 65)

    return weekly_result

def generate_ts_code(wod_data):
    """Genera código TypeScript para wods.data.ts a partir del diccionario de WODs."""
    ts_lines = ["import { DayWods } from '../models/wod.model';\n"]
    ts_lines.append("export const WODS_DATA: DayWods = {")

    days_order = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']

    for day in days_order:
        items = wod_data.get(day, [])
        ts_lines.append(f"  {day}: [")
        for item in items:
            title = item['titulo'].replace("'", "\\'")
            content = item['contenido'].replace('`', '\\`').replace('${', '\\${')
            ts_lines.append("    {")
            ts_lines.append(f"      titulo: '{title}',")
            ts_lines.append(f"      contenido: `{content}`")
            ts_lines.append("    },")
        ts_lines.append("  ],")

    ts_lines.append("};\n")
    return "\n".join(ts_lines)

def update_offline_wods_file(weekly_result):
    """Actualiza src/app/core/data/wods.data.ts para el respaldo offline del sistema."""
    try:
        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        target_path = os.path.join(project_root, "src", "app", "core", "data", "wods.data.ts")
        ts_code = generate_ts_code(weekly_result)
        with open(target_path, 'w', encoding='utf-8') as f:
            f.write(ts_code)
        print(f"💾 Respaldo offline estático actualizado en: {target_path}")
        return True
    except Exception as e:
        print(f"⚠️ Error al actualizar archivo de respaldo offline: {e}")
        return False

def publish_to_wod_tv(weekly_result, admin_email, admin_password):
    """
    Inicia sesión con la cuenta de Administrador de WOD-TV,
    publica la rutina en weeklyWods y registra la auditoría.
    """
    import requests

    api_key = os.environ.get("FIREBASE_API_KEY", "AIzaSyCC3idHLHcFFcGOAbdJGtuWYsrV0PFf8Oc")
    db_url = os.environ.get("FIREBASE_DATABASE_URL", "https://crosssfit--3640-tv-default-rtdb.firebaseio.com").rstrip("/")

    print(f"\n🔐 [3/3] Autenticando en WOD-TV como Administrador ({admin_email})...")
    auth_url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={api_key}"
    auth_payload = {
        "email": admin_email,
        "password": admin_password,
        "returnSecureToken": True
    }

    try:
        auth_resp = requests.post(auth_url, json=auth_payload, timeout=15)
        if auth_resp.status_code != 200:
            print(f"❌ Error al iniciar sesión en WOD-TV ({auth_resp.status_code}): {auth_resp.text}")
            return False

        id_token = auth_resp.json().get("idToken")
        print("✅ Sesión de Super Administrador iniciada correctamente.")

        # 1. Guardar weeklyWods
        wods_endpoint = f"{db_url}/weeklyWods.json?auth={id_token}"
        print(f"☁️ Publicando WODs semanales a las pantallas de los televisores...")
        put_resp = requests.put(wods_endpoint, json=weekly_result, timeout=15)

        if put_resp.status_code in [200, 201]:
            print("🎉 ¡WODS SEMANALES PUBLICADOS EXITOSAMENTE EN LAS PANTALLAS DEL BOX!")
        else:
            print(f"❌ Error al guardar WODs en las pantallas ({put_resp.status_code}): {put_resp.text}")
            return False

        # 2. Registrar en Auditoría (activityLogs) de WOD-TV
        now = datetime.datetime.now()
        log_entry = {
            "timestamp": int(now.timestamp() * 1000),
            "formattedDate": now.strftime("%d/%m/%Y %H:%M"),
            "email": admin_email,
            "action": "Publicación Automática CrossHero",
            "details": "Agente Autónomo sincronizó los 7 días de la semana con éxito"
        }
        log_endpoint = f"{db_url}/activityLogs.json?auth={id_token}"
        try:
            requests.post(log_endpoint, json=log_entry, timeout=10)
            print("📋 Registro de auditoría guardado en el panel de WOD-TV.")
        except Exception as e:
            print(f"⚠️ Nota de auditoría: {e}")

        return True
    except Exception as e:
        print(f"❌ Error de conexión con WOD-TV: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Extractor de WODs de CrossHero para WOD-3640-TV")
    parser.add_argument("--email", default=os.environ.get("CROSSHERO_EMAIL"))
    parser.add_argument("--password", default=os.environ.get("CROSSHERO_PASSWORD"))
    parser.add_argument("--admin-email", default=os.environ.get("WOD_TV_ADMIN_EMAIL"))
    parser.add_argument("--admin-password", default=os.environ.get("WOD_TV_ADMIN_PASSWORD"))
    parser.add_argument("--target-week", choices=["current", "next"], default="current")
    parser.add_argument("--dry-run", action="store_true", default=False, help="Solo extraer y guardar localmente sin publicar a Firebase")
    parser.add_argument("--publish", action="store_true", default=False, help="Publicar el resultado directamente a Firebase usando credenciales de WOD-TV")
    parser.add_argument("--update-offline", action="store_true", default=False, help="Actualizar archivo estático wods.data.ts")
    parser.add_argument("--screenshots-dir", default="artifacts/screenshots")

    args = parser.parse_args()

    if not args.email or not args.password:
        print("❌ Error: Debes proporcionar correo y contraseña de CrossHero vía argumentos (--email, --password) o variables de entorno (CROSSHERO_EMAIL, CROSSHERO_PASSWORD).")
        sys.exit(1)

    is_dry_run = not args.publish

    weekly_result = run_sync(
        email=args.email,
        password=args.password,
        target_week=args.target_week,
        dry_run=is_dry_run,
        publish_firebase=args.publish,
        screenshots_dir=args.screenshots_dir
    )

    if args.publish or args.update_offline:
        update_offline_wods_file(weekly_result)

    if args.publish:
        admin_mail = args.admin_email or os.environ.get("WOD_TV_ADMIN_EMAIL")
        admin_pass = args.admin_password or os.environ.get("WOD_TV_ADMIN_PASSWORD")
        if not admin_mail or not admin_pass:
            print("⚠️ No se proporcionaron las credenciales completas de Administrador de WOD-TV (WOD_TV_ADMIN_EMAIL, WOD_TV_ADMIN_PASSWORD). No se pudo publicar.")
        else:
            publish_to_wod_tv(weekly_result, admin_mail, admin_pass)

if __name__ == '__main__':
    main()
