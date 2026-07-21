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
            r'^(Warmup|WARM-UP|Gymnastics|Custom Metcon|Weightlifting|Accesorio|OPTIONAL ACCESSORY)(\s*\(.*?\))?$',
            re.IGNORECASE
        )

        for line in lines:
            trimmed = line.strip()

            is_header = bool(header_regex.match(trimmed))

            if is_header:
                if current_title is not None:
                    items.append({
                        'titulo': current_title,
                        'contenido': '\n'.join(current_lines).strip()
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
                'titulo': current_title,
                'contenido': '\n'.join(current_lines).strip()
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
