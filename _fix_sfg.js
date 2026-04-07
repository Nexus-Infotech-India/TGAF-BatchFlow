const fs = require('fs');
const filePath = 'client/src/components/pages/packaging/NewFGProductionEntryPage.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const old = 'line.availableSfgBatches[0].remainingQuantity} {line.availableSfgBatches[0].unit}';
const replacement = 'line.availableSfgBatches.reduce((s, b) => s + b.remainingQuantity, 0)} {line.availableSfgBatches[0].unit}';

if (content.includes(old)) {
  content = content.replace(old, replacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('SUCCESS: Replaced SFG display to sum all batches');
} else {
  console.log('ERROR: Target string not found in file');
  // Debug: find lines with remainingQuantity
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    if (line.includes('remainingQuantity')) {
      console.log(`  Line ${i+1}: ${line.trim()}`);
    }
  });
}
