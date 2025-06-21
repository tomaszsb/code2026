/**
 * Clean dice roll outcomes in DiceRoll Info.csv
 * Remove descriptions from space names in dice outcomes
 */

const fs = require('fs');
const path = require('path');

function cleanSpaceName(outcome) {
    if (!outcome) return '';
    
    const cleaned = outcome.trim();
    
    // Handle special cases
    if (cleaned === 'No change' || cleaned === '') {
        return cleaned;
    }
    
    // Handle multiple options with "or"
    if (cleaned.includes(' or ')) {
        const options = cleaned.split(' or ').map(opt => {
            const trimmed = opt.trim();
            // Split on " - " and take first part
            return trimmed.split(' - ')[0];
        });
        return options.join(' or ');
    }
    
    // Single space - split on " - " and take first part
    return cleaned.split(' - ')[0];
}

function cleanDiceCSV() {
    const csvPath = path.join(__dirname, '../data/DiceRoll Info.csv');
    const backupPath = path.join(__dirname, '../data/DiceRoll Info.csv.backup');
    
    console.log('Reading Dice CSV file...');
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    
    // Create backup
    fs.writeFileSync(backupPath, csvContent);
    console.log('Backup created at:', backupPath);
    
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',');
    
    // Find dice outcome columns (1-6)
    const outcomeColumns = [];
    for (let i = 1; i <= 6; i++) {
        const index = headers.indexOf(i.toString());
        if (index !== -1) {
            outcomeColumns.push(index);
        }
    }
    
    console.log('Outcome columns found at indices:', outcomeColumns);
    
    const cleanedLines = [lines[0]]; // Keep header as-is
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;
        
        const columns = line.split(',');
        
        // Clean outcome columns
        outcomeColumns.forEach(colIndex => {
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
    
    console.log('Dice CSV cleaned successfully!');
    console.log('Backup available at:', backupPath);
}

if (require.main === module) {
    cleanDiceCSV();
}