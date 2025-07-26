/**
 * One-time script to clean space names in Spaces.csv
 * Removes descriptions from space_1 through space_5 columns
 */

const fs = require('fs');
const path = require('path');

function cleanSpaceName(spaceName) {
    if (!spaceName) return '';
    
    const cleaned = spaceName.trim();
    
    // Handle special cases
    if (cleaned === 'n/a' || cleaned === '{ORIGINAL_SPACE}' || cleaned === '') {
        return cleaned;
    }
    
    // Handle complex logic fields (these should be handled differently)
    if (cleaned.includes('Did you') || cleaned.includes('YES -') || cleaned.includes('NO -')) {
        return cleaned; // Keep logic fields as-is for now
    }
    
    // Split on " - " and take first part (the actual space name)
    return cleaned.split(' - ')[0];
}

function cleanCSV() {
    const csvPath = path.join(__dirname, '../data/Spaces.csv');
    const backupPath = path.join(__dirname, '../data/Spaces.csv.backup');
    
    console.log('Reading CSV file...');
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    
    // Create backup
    fs.writeFileSync(backupPath, csvContent);
    console.log('Backup created at:', backupPath);
    
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',');
    
    // Find space_1 through space_5 column indices
    const spaceColumns = [];
    for (let i = 1; i <= 5; i++) {
        const index = headers.indexOf(`space_${i}`);
        if (index !== -1) {
            spaceColumns.push(index);
        }
    }
    
    console.log('Space columns found at indices:', spaceColumns);
    
    const cleanedLines = [lines[0]]; // Keep header as-is
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;
        
        const columns = line.split(',');
        
        // Clean space columns
        spaceColumns.forEach(colIndex => {
            if (columns[colIndex]) {
                const original = columns[colIndex];
                const cleaned = cleanSpaceName(original);
                if (original !== cleaned) {
                    console.log(`Row ${i}: "${original}" -> "${cleaned}"`);
                }
                columns[colIndex] = cleaned;
            }
        });
        
        cleanedLines.push(columns.join(','));
    }
    
    const cleanedContent = cleanedLines.join('\n');
    fs.writeFileSync(csvPath, cleanedContent);
    
    console.log('CSV cleaned successfully!');
    console.log('Backup available at:', backupPath);
}

if (require.main === module) {
    cleanCSV();
}