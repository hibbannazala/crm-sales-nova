// Test date parsing
const dateStr = "2025-26-05"; // YYYY-DD-MM or YYYY-MM-DD? Wait. "2025-26-05" has day=26, month=05. So it's YYYY-DD-MM.
// Let's create a parser.
function parseDate(dateStr) {
  if (!dateStr) return null;
  // If it matches YYYY-DD-MM (where DD > 12)
  const parts = dateStr.split(/[-T/]/);
  if (parts.length >= 3) {
    const year = parseInt(parts[0]);
    const p1 = parseInt(parts[1]);
    const p2 = parseInt(parts[2].substring(0,2)); // in case of '05T10:00:00'
    
    if (year > 2000 && p1 > 12 && p2 <= 12) {
      // It's YYYY-DD-MM
      return `${year}-${String(p2).padStart(2, '0')}-${String(p1).padStart(2, '0')}`;
    }
  }
  
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

console.log(parseDate("2025-26-05"));
console.log(parseDate("2025-05-26T10:00:00Z"));
