/**
 * Script utilitario para convertir un archivo de texto (.txt) con ejercicios WOD a formato JSON.
 * 
 * Uso:
 *   node scripts/convert-wod-txt.js <ruta-al-archivo.txt>
 * 
 * Ejemplo:
 *   node scripts/convert-wod-txt.js mi_wod.txt
 */

const fs = require('fs');
const path = require('path');

const filePath = process.argv[2];

if (!filePath) {
  console.log('Uso: node scripts/convert-wod-txt.js <ruta-al-archivo.txt>');
  process.exit(1);
}

const fullPath = path.resolve(filePath);
if (!fs.existsSync(fullPath)) {
  console.error(`Error: El archivo "${fullPath}" no existe.`);
  process.exit(1);
}

const rawText = fs.readFileSync(fullPath, 'utf8');

// Separar bloques por doble salto de línea
const blocks = rawText.split(/\n\s*\n/).filter(b => b.trim().length > 0);

const result = blocks.map(block => {
  const lines = block.trim().split('\n');
  const firstLine = lines[0].trim();

  if (lines.length === 1) {
    return { titulo: 'WOD', contenido: firstLine };
  }

  if (firstLine.length <= 40) {
    return {
      titulo: firstLine.replace(/^[#*-\s]+/, '').replace(/[:*]+$/, '').trim(),
      contenido: lines.slice(1).join('\n').trim()
    };
  } else {
    return {
      titulo: 'WOD',
      contenido: block.trim()
    };
  }
});

console.log('--- JSON RESULTANTE ---');
console.log(JSON.stringify(result, null, 2));

const outputPath = fullPath.replace(/\.txt$/i, '') + '_output.json';
fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
console.log(`\n✅ Archivo JSON guardado en: ${outputPath}`);
