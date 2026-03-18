import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toProperCase(text: string): string {
  if (!text) return text;
  
  // Roman numerals pattern - matches roman numerals anywhere in the text
  const romanNumeralPattern = /\b(i{1,3}|i?v|vi{0,3}|i?x|xi{0,3}|xv|xvi{0,3}|xx)\b/gi;
  
  return text
    .toLowerCase()
    .split(' ')
    .map(word => {
      // Handle patterns like "Tk.i" or "iii/d"
      return word.replace(romanNumeralPattern, (match) => match.toUpperCase())
        .replace(/^(.)/, (match) => match.toUpperCase());
    })
    .join(' ');
}

export function formatDateToDDMMYYYY(dateString: string): string {
  if (!dateString) return dateString;
  
  // Check if already in dd-mm-yyyy format
  if (/^\d{2}-\d{2}-\d{4}/.test(dateString)) return dateString;
  
  // Handle date ranges with "s/d" or "s.d" separator
  if (dateString.includes(' s/d ') || dateString.includes(' s.d ')) {
    const separator = dateString.includes(' s/d ') ? ' s/d ' : ' s.d ';
    const parts = dateString.split(separator);
    return parts.map(part => formatDateToDDMMYYYY(part.trim())).join(separator);
  }
  
  // Handle multiple dates separated by semicolon
  if (dateString.includes(';')) {
    return dateString.split(';').map(date => formatDateToDDMMYYYY(date.trim())).join('; ');
  }
  
  // Convert yyyy-mm-dd to dd-mm-yyyy
  const match = dateString.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [_, year, month, day] = match;
    return dateString.replace(/\d{4}-\d{2}-\d{2}/, `${day}-${month}-${year}`);
  }
  
  return dateString;
}
