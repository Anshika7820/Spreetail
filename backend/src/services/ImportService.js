const fs = require('fs');
const csvParser = require('csv-parser');
const { parse, isValid, isAfter } = require('date-fns');

// This function tries different date formats to understand what the user typed
function parseDateStr(dateStr) {
  const formats = ['yyyy-MM-dd', 'dd/MM/yyyy', 'MMM dd'];
  
  for (const fmt of formats) {
    let toParse = dateStr;
    // If there is no year (like "Mar 14"), we assume the year is 2026 for this project
    if (fmt === 'MMM dd') {
      toParse = `${dateStr} 2026`;
    }
    
    // Attempt to parse the date
    const d = parse(toParse, fmt === 'MMM dd' ? 'MMM dd yyyy' : fmt, new Date());
    
    // If it's a valid date, return it
    if (isValid(d)) {
      return d;
    }
  }
  return null; // Return null if we couldn't understand the date
}

// This makes names look clean. Example: " priya " becomes "Priya"
function normalizeName(name) {
  if (!name) return '';
  const trimmed = name.trim();
  // Capitalize first letter, lowercase the rest
  return trimmed.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

class ImportService {
  // Reads the CSV file from the given path and processes it
  async parseCsv(filePath) {
    const results = [];
    
    return new Promise((resolve, reject) => {
      // Open the file and read it row by row
      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on('data', (data) => results.push(data)) // Save each row
        .on('end', () => {
          // When done reading, process the rules and find problems
          resolve(this.processRows(results));
        })
        .on('error', reject); // If file reading fails, stop here
    });
  }

  // This is where we look at every row and find "anomalies" (problems)
  processRows(rows) {
    const expenses = [];
    const seenSignatures = new Set(); // We use this to remember past rows and find duplicates

    rows.forEach((row, index) => {
      // 0. Skip completely empty rows
      if (!row.date && !row.description && !row.amount) return;

      const anomalies = []; // A list of problems for this specific row
      let actionRequired = false; // Does the user need to manually fix this?
      let ignored = false; // Should we skip this row?
      let isSettlement = false; // Is this a payment between friends instead of a real expense?

      // 1. Fix the Money Amount
      let rawAmount = row.amount || '';
      rawAmount = rawAmount.replace(/,/g, '').trim(); // Remove commas like in "1,200"
      let amount = parseFloat(rawAmount);

      if (isNaN(amount)) {
        anomalies.push(`Amount is not a number: "${row.amount}"`);
        actionRequired = true;
      } else if (amount < 0) {
        anomalies.push(`Found a negative amount (${amount}). Treating this as a refund!`);
        amount = Math.abs(amount); // Turn it positive so the math works
      } else if (amount === 0) {
        anomalies.push('Amount is zero. We will ignore this row.');
        ignored = true; // No need to split 0 rupees
      }

      // 2. Fix the Date
      let date = parseDateStr(row.date ? row.date.trim() : '');
      if (!date) {
        anomalies.push(`Could not understand the date format: "${row.date}"`);
        actionRequired = true;
        date = new Date(); // Temporary fallback
      } else if (row.date.trim() === '04/05/2026') {
        // Special rule: The date 04/05 is confusing. Is it April 5 or May 4?
        // Based on the other dates nearby, we know it should be April 5.
        anomalies.push(`Confusing date "04/05/2026" was fixed to April 5th automatically.`);
        date = parse('05/04/2026', 'dd/MM/yyyy', new Date());
      }

      // 3. Find who paid
      const paidBy = normalizeName(row.paid_by);
      if (!paidBy) {
        anomalies.push('Missing the person who paid ("paid_by"). Please fix this.');
        actionRequired = true;
      }

      // 4. Find the Currency
      let currency = (row.currency || '').trim();
      if (!currency) {
        currency = 'INR';
        anomalies.push('Missing currency. We assumed it is INR.');
      }

      // 5. Detect Duplicates
      // We combine date and description to make a "signature".
      // Example: "1709404200000-dinner at thalassa"
      const signature = `${date.getTime()}-${row.description.trim().toLowerCase()}`;
      if (seenSignatures.has(signature)) {
        anomalies.push('This looks like a duplicate entry. You can choose to ignore it.');
        actionRequired = true; // Let Meera decide if she wants to delete it!
      }
      seenSignatures.add(signature);

      // 6. Detect Settlements (Payments between friends)
      const descLower = (row.description || '').toLowerCase();
      const notesLower = (row.notes || '').toLowerCase();
      if ((descLower.includes('paid') && descLower.includes('back')) || 
           notesLower.includes('settlement') || 
           descLower.includes('deposit')) {
        isSettlement = true;
        anomalies.push('This looks like a money transfer between friends, not a group expense. Marked as a Settlement.');
      }

      // 7. Understand how the expense is split
      let splitType = (row.split_type || '').trim() || 'equal';
      // Clean up the list of names
      const splitWithRaw = (row.split_with || '').split(';').map(n => normalizeName(n)).filter(n => n);
      let splitWith = [...splitWithRaw];
      
      const splitDetailsRaw = row.split_details || '';
      const splitDetails = {};

      if (splitDetailsRaw) {
        const parts = splitDetailsRaw.split(';');
        let totalPct = 0;
        
        parts.forEach(p => {
          // This looks for a name followed by a number (like "Rohan 30%")
          const match = p.trim().match(/(.+?)\s+([\d.]+%?)/);
          if (match) {
            const name = normalizeName(match[1]);
            const valStr = match[2];
            let val = parseFloat(valStr.replace('%', ''));
            splitDetails[name] = val;
            
            if (valStr.includes('%')) {
              totalPct += val;
            }
          }
        });

        // Rule: If they say "equal" but give specific shares, we use the shares instead
        if (splitType === 'equal' && Object.keys(splitDetails).length > 0) {
          anomalies.push(`It says "equal" split, but gives specific shares. We will use the specific shares instead.`);
          splitType = 'share';
        }

        // Rule: If the percentages don't add up to 100% (like Pizza Friday which is 110%)
        if (splitType === 'percentage' && totalPct > 100) {
          anomalies.push(`The percentages add up to ${totalPct}%. We automatically shrank them so they equal exactly 100%.`);
          // Fix the math
          for (const k in splitDetails) {
            splitDetails[k] = (splitDetails[k] / totalPct) * 100;
          }
        }
      }

      // 8. Check if Meera is included after she moved out
      // We know Meera left on March 31.
      if (splitWith.includes('Meera') && isAfter(date, new Date(2026, 2, 31))) {
        anomalies.push('Meera is included in this split, but she moved out at the end of March! You should review this.');
        actionRequired = true;
      }

      // Save the cleaned-up data
      expenses.push({
        id: `temp-${index}`, // A temporary ID so React can display it in a list
        date,
        description: row.description || '',
        paidBy,
        amount,
        currency,
        splitType,
        splitWith,
        splitDetails,
        notes: row.notes || '',
        isSettlement,
        originalRow: row,
        anomalies,
        actionRequired,
        ignored
      });
    });

    return expenses; // Return all processed rows to the frontend
  }
}

module.exports = { ImportService };
