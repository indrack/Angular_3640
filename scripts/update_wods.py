#!/usr/bin/env python3
"""
Script para procesar texto de WODs semanales y generar automáticamente
los archivos TypeScript `wods.data.ts` o `wgirls.data.ts`.

Uso:
  python3 scripts/update_wods.py <ruta_al_txt> [--wgirls] [--out <ruta_salida>]

Ejemplo:
  python3 scripts/update_wods.py semana.txt
  python3 scripts/update_wods.py wgirls_semana.txt --wgirls
"""

import sys
import re
import os

def clean_title(title):
    if not title:
        return title
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

    full_line_patterns = [
        r'^\d+\s*(?:SETS?|ROUNDS?|Rounds?|Sets?)(?:\s*(?:of|for quality of|for time of|each))?:?$',
        r'^\d+\s*ROUND\s*EACH$',
        r'^EMOM\s*x?\s*[\d:]+.*$',
        r'^AMRAP\s*[\d:]+.*$',
        r'^(?:For time:?|FOR TIME:?)$',
        r'^Time cap:?\s*[\d:]+\s*(?:mins?|min|m|horas?|hrs?)?\.?$',
        r'^ON A\s+[\d:]+\s+CLOCK.*$',
        r'^Every\s+[\d:]+\s+(?:mins?\s+)?for\s+[\d:]+\s+mins?\.?$',
        r'^Rest\s+\d+\s*(?:mins?|min|seg|s)\.?$',
        r'^Into\.{2,3}:?$',
        r'^(?:IN\s+)?TEAMS?\s+OF\s+\d+.*$',
        r'^Complete in teams of \d+\.?$',
        r'^Complete as-?$',
        r'^Athletes have\s+[\d:]+\s+at each station.*$',
        r'^All\s+\d+\s+reps unbroken.*$'
    ]
    full_line_regex = re.compile('|'.join(f'(?:{p})' for p in full_line_patterns), re.IGNORECASE)
    minute_partner_regex = re.compile(r'^(\s*(?:Minute|Minuto|Partner|P)\s+\d+:?)(.*)$', re.IGNORECASE)

    formatted_lines = []
    for line in cleaned_lines:
        trimmed = line.strip()
        if not trimmed:
            formatted_lines.append(line)
            continue

        if trimmed.startswith('*') and trimmed.endswith('*') and len(trimmed) > 2:
            formatted_lines.append(line)
            continue

        mp_match = minute_partner_regex.match(line)
        if mp_match:
            prefix, rest = mp_match.groups()
            if not prefix.strip().startswith('*'):
                formatted_lines.append(f"*{prefix.strip()}*{rest}")
                continue

        if full_line_regex.match(trimmed):
            leading_spaces = len(line) - len(line.lstrip())
            formatted_lines.append(f"{' ' * leading_spaces}*{trimmed}*")
        else:
            formatted_lines.append(line)

    return '\n'.join(formatted_lines)

def parse_wod_text(raw_text):
    days_map = {
        'domingo': 'domingo',
        'lunes': 'lunes',
        'martes': 'martes',
        'miercoles': 'miercoles',
        'miércoles': 'miercoles',
        'jueves': 'jueves',
        'viernes': 'viernes',
        'sabado': 'sabado',
        'sábado': 'sabado'
    }

    # Separador tipo: ------------------------Domingo---------------------------
    day_pattern = re.compile(r'-{3,}\s*([A-Za-záéíóúÁÉÍÓÚ]+)\s*-{3,}')
    parts = day_pattern.split(raw_text)

    wod_data = {
        'domingo': [],
        'lunes': [],
        'martes': [],
        'miercoles': [],
        'jueves': [],
        'viernes': [],
        'sabado': []
    }

    if len(parts) < 2:
        print("⚠️ Advertencia: No se encontraron delimitadores de día (ej: ------------------------Lunes---------------------------)")
        return wod_data

    # Iterar sobre las coincidencias
    for i in range(1, len(parts), 2):
        day_raw = parts[i].strip().lower()
        day_key = days_map.get(day_raw, None)

        if not day_key:
            continue

        day_content = parts[i+1].strip()
        lines = day_content.split('\n')

        items = []
        current_title = None
        current_lines = []

        # Títulos de sección conocidos o patrones
        header_regex = re.compile(
            r'^(Warmup|WARM-UP|Gymnastics|Custom Metcon|Weightlifting|Accesorio|OPTIONAL ACCESSORY|Strength|Skill|Finisher)(\s*\(.*?\))?$',
            re.IGNORECASE
        )

        for line in lines:
            trimmed = line.strip()

            is_header = bool(header_regex.match(trimmed))

            if is_header:
                if current_title is not None:
                    items.append({
                        'titulo': clean_title(current_title),
                        'contenido': format_wod_content('\n'.join(current_lines).strip())
                    })
                    current_lines = []
                current_title = trimmed
            else:
                if current_title is not None:
                    current_lines.append(line)
                elif trimmed:
                    # Si hay texto antes de un título explícito, asignamos 'WOD'
                    current_title = 'WOD'
                    current_lines.append(line)

        if current_title is not None:
            items.append({
                'titulo': clean_title(current_title),
                'contenido': format_wod_content('\n'.join(current_lines).strip())
            })

        wod_data[day_key] = items

    return wod_data

def generate_ts_code(wod_data, is_wgirls=False):
    var_name = "WGIRLS_DATA" if is_wgirls else "WODS_DATA"
    ts_lines = ["import { DayWods } from '../models/wod.model';\n"]
    ts_lines.append(f"export const {var_name}: DayWods = {{")

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

def main():
    if len(sys.argv) < 2:
        print("Uso: python3 scripts/update_wods.py <ruta_al_txt> [--wgirls]")
        sys.exit(1)

    file_path = sys.argv[1]
    is_wgirls = '--wgirls' in sys.argv

    if not os.path.exists(file_path):
        print(f"Error: El archivo '{file_path}' no existe.")
        sys.exit(1)

    with open(file_path, 'r', encoding='utf-8') as f:
        raw_text = f.read()

    parsed_wod = parse_wod_text(raw_text)
    ts_code = generate_ts_code(parsed_wod, is_wgirls)

    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    target_filename = "wgirls.data.ts" if is_wgirls else "wods.data.ts"
    target_path = os.path.join(project_root, "src", "app", "core", "data", target_filename)

    with open(target_path, 'w', encoding='utf-8') as f:
        f.write(ts_code)

    print(f"✅ Se actualizó correctamente '{target_filename}' en {target_path}")

if __name__ == '__main__':
    main()
