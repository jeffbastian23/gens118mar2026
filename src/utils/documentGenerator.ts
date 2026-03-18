import { 
  Document, Paragraph, TextRun, AlignmentType, HeadingLevel, Packer,
  Table, TableRow, TableCell, WidthType, BorderStyle, ImageRun,
  UnderlineType, convertInchesToTwip
} from "docx";
import { saveAs } from "file-saver";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { toProperCase } from "@/lib/utils";

/**
 * Clean jabatan for ND/ST document generation:
 * 1. If contains "Pemeriksa" followed by " Pada ", remove from " Pada " onwards
 * 2. Otherwise, if contains a comma, remove from the first comma onwards
 * 3. Kepala/head positions without comma stay unchanged
 */
const cleanJabatanForDocument = (jabatan: string): string => {
  if (!jabatan) return jabatan;
  
  // Rule 1: If contains "Pemeriksa" followed by " Pada ", truncate at " Pada "
  const pemeriksaPadaMatch = jabatan.match(/^(.*?Pemeriksa)\s+Pada\s/i);
  if (pemeriksaPadaMatch) {
    return pemeriksaPadaMatch[1];
  }
  
  // Rule 2: If contains a comma, remove from the first comma onwards
  const commaIndex = jabatan.indexOf(',');
  if (commaIndex > 0) {
    return jabatan.substring(0, commaIndex).trim();
  }
  
  return jabatan;
};

/**
 * Format pangkat/gol.ruang separator: replace " - " with " / " 
 * e.g., "Pembina Utama Madya - IV/d" → "Pembina Utama Madya / IV/d"
 */
const formatPangkatSeparator = (pangkat: string): string => {
  if (!pangkat) return pangkat;
  return pangkat.replace(/\s*-\s*((?:IV|III|II|I)\/[a-eA-E])/i, ' / $1');
};

interface Employee {
  nm_pegawai: string;
  uraian_pangkat: string;
  uraian_jabatan: string;
  gol_ruang?: string;
  nip?: string;
}

interface AssignmentData {
  nomor_surat: string;
  dasar_penugasan: string;
  nomor_naskah_dinas: string;
  tanggal_naskah: string;
  perihal: string;
  employees: Employee[];
  tujuan: string;
  tanggal_kegiatan: string;
  waktu_penugasan: string;
  tempat_penugasan: string;
  alamat_penugasan?: string;
  pejabat_penandatangan: Employee;
  tanggal_surat: Date;
  unit_pemohon?: string;
  unit_penerbit?: string;
  sumber?: string;
  sumber_satuan_kerja?: string;
  sumber_satuan_kerja_custom?: string;
}

// Sort employees by rank/position (highest first)
// Indonesian Civil Service Ranking System
const sortEmployeesByRank = (employees: Employee[]): Employee[] => {
  const getRankLevel = (pangkat: string, golRuang?: string): { golongan: number; tingkat: string } => {
    let golongan = 0;
    let tingkat = '';
    
    // Extract golongan from gol_ruang first (more reliable), then from pangkat
    if (golRuang) {
      if (golRuang.startsWith('IV')) golongan = 4;
      else if (golRuang.startsWith('III')) golongan = 3;
      else if (golRuang.startsWith('II')) golongan = 2;
      else if (golRuang.startsWith('I')) golongan = 1;
      
      // Extract tingkat from gol_ruang (e.g., "IV/e" -> "e")
      const parts = golRuang.split('/');
      if (parts.length > 1) {
        tingkat = parts[1].toLowerCase().trim();
      }
    }
    
    // Fallback: extract gol_ruang from pangkat string (e.g., "Pembina Utama Madya - IV/d")
    if (!golongan && pangkat) {
      const golMatch = pangkat.match(/(IV|III|II|I)\/([a-eA-E])/i);
      if (golMatch) {
        const romawi = golMatch[1].toUpperCase();
        if (romawi === 'IV') golongan = 4;
        else if (romawi === 'III') golongan = 3;
        else if (romawi === 'II') golongan = 2;
        else if (romawi === 'I') golongan = 1;
        tingkat = golMatch[2].toLowerCase();
      }
    }
    
    // Further fallback to pangkat name if still no golongan
    if (!golongan) {
      const pangkatUpper = pangkat.toUpperCase();
      if (pangkatUpper.includes('IV')) golongan = 4;
      else if (pangkatUpper.includes('III')) golongan = 3;
      else if (pangkatUpper.includes('II')) golongan = 2;
      else if (pangkatUpper.includes('I')) golongan = 1;
    }
    
    // Extract tingkat from pangkat name if not found in gol_ruang
    if (!tingkat && pangkat) {
      const pangkatLower = pangkat.toLowerCase();
      
      // Golongan IV (Pembina)
      if (pangkatLower.includes('pembina utama') && !pangkatLower.includes('madya') && !pangkatLower.includes('muda')) {
        tingkat = 'e';
      } else if (pangkatLower.includes('pembina utama madya')) {
        tingkat = 'd';
      } else if (pangkatLower.includes('pembina utama muda')) {
        tingkat = 'c';
      } else if (pangkatLower.includes('pembina tingkat i') || pangkatLower.includes('pembina tk. i')) {
        tingkat = 'b';
      } else if (pangkatLower.includes('pembina') && golongan === 4) {
        tingkat = 'a';
      }
      // Golongan III (Penata)
      else if (pangkatLower.includes('penata tingkat i') || pangkatLower.includes('penata tk. i')) {
        tingkat = 'd';
      } else if (pangkatLower.includes('penata') && !pangkatLower.includes('muda') && golongan === 3) {
        tingkat = 'c';
      } else if (pangkatLower.includes('penata muda tingkat i') || pangkatLower.includes('penata muda tk. i')) {
        tingkat = 'b';
      } else if (pangkatLower.includes('penata muda')) {
        tingkat = 'a';
      }
      // Golongan II (Pengatur)
      else if (pangkatLower.includes('pengatur tingkat i') || pangkatLower.includes('pengatur tk. i')) {
        tingkat = 'd';
      } else if (pangkatLower.includes('pengatur') && !pangkatLower.includes('muda') && golongan === 2) {
        tingkat = 'c';
      } else if (pangkatLower.includes('pengatur muda tingkat i') || pangkatLower.includes('pengatur muda tk. i')) {
        tingkat = 'b';
      } else if (pangkatLower.includes('pengatur muda')) {
        tingkat = 'a';
      }
      // Golongan I (Juru)
      else if (pangkatLower.includes('juru tingkat i') || pangkatLower.includes('juru tk. i')) {
        tingkat = 'd';
      } else if (pangkatLower.includes('juru') && !pangkatLower.includes('muda') && golongan === 1) {
        tingkat = 'c';
      } else if (pangkatLower.includes('juru muda tingkat i') || pangkatLower.includes('juru muda tk. i')) {
        tingkat = 'b';
      } else if (pangkatLower.includes('juru muda')) {
        tingkat = 'a';
      }
      // Generic fallback for "Tingkat I" pattern
      else if (pangkatLower.includes('tingkat i') || pangkatLower.includes('tk. i')) {
        tingkat = 'd';
      }
      
      // Final fallback
      if (!tingkat) {
        tingkat = 'a';
      }
    }
    
    return { golongan, tingkat };
  };
  
  // Ranking order: e > d > c > b > a
  const tingkatOrder: { [key: string]: number } = {
    'e': 5, 'd': 4, 'c': 3, 'b': 2, 'a': 1, '': 0
  };
  
  return [...employees].sort((a, b) => {
    const rankA = getRankLevel(a.uraian_pangkat, a.gol_ruang);
    const rankB = getRankLevel(b.uraian_pangkat, b.gol_ruang);
    
    // First compare golongan (IV > III > II > I, i.e., 4 > 3 > 2 > 1)
    if (rankA.golongan !== rankB.golongan) {
      return rankB.golongan - rankA.golongan;
    }
    
    // If golongan is the same, compare tingkat (e > d > c > b > a)
    const tingkatA = tingkatOrder[rankA.tingkat] || 0;
    const tingkatB = tingkatOrder[rankB.tingkat] || 0;
    
    if (tingkatA !== tingkatB) {
      return tingkatB - tingkatA;
    }
    
    // If both golongan and tingkat are the same, sort alphabetically by name
    return a.nm_pegawai.localeCompare(b.nm_pegawai, 'id');
  });
};

// Normalize XML to merge fragmented text runs
const normalizeDocumentXml = (xml: string): string => {
  console.log("🔧 [normalizeDocumentXml] Starting XML normalization");
  let normalized = xml;
  let iteration = 0;
  let changed = true;
  
  while (changed && iteration < 50) {
    const before = normalized;
    
    // Merge adjacent text runs: <w:t>text1</w:t></w:r><w:r><w:t>text2</w:t> → <w:t>text1text2</w:t>
    normalized = normalized.replace(
      /(<w:t(?:\s+[^>]*)?>)([^<]*)<\/w:t><\/w:r>\s*<w:r[^>]*>\s*<w:t(?:\s+[^>]*)?>([^<]*)<\/w:t>/g,
      '$1$2$3</w:t></w:r><w:r><w:t xml:space="preserve">'
    );
    
    // Merge adjacent text runs within same run: <w:t>text1</w:t><w:t>text2</w:t> → <w:t>text1text2</w:t>
    normalized = normalized.replace(
      /(<w:t(?:\s+[^>]*)?>)([^<]*)<\/w:t>\s*<w:t(?:\s+[^>]*)?>([^<]*)<\/w:t>/g,
      '$1$2$3</w:t>'
    );
    
    changed = (before !== normalized);
    iteration++;
  }
  
  console.log(`✅ [normalizeDocumentXml] Completed ${iteration} normalization passes`);
  return normalized;
};

// Remove empty table rows from document XML
const removeEmptyTableRows = (xml: string): string => {
  console.log("🧹 [removeEmptyTableRows] Starting removal of empty table rows");
  
  // Regex to capture entire table row
  const tableRowRegex = /<w:tr[^>]*>[\s\S]*?<\/w:tr>/g;
  let removedCount = 0;
  
  const result = xml.replace(tableRowRegex, (match) => {
    // Extract all text content from this row
    const textRegex = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g;
    const texts: string[] = [];
    let textMatch;
    
    while ((textMatch = textRegex.exec(match)) !== null) {
      // Normalize non-breaking spaces and XML-escaped spaces
      const raw = (textMatch[1] || '').replace(/\u00A0|&nbsp;/g, ' ');
      texts.push(raw);
    }
    
    const combinedText = texts.join('').trim();

    // Heuristic 1: If there are NO letters at all in the row, it's likely only numbering/punctuation
    const hasLetters = /[A-Za-zÀ-ÖØ-öø-ÿ]/.test(combinedText);

    // Heuristic 2: Remove rows that only contain digits and punctuation like "3.", "3)", "3-"
    const onlyIndexAndPunct = combinedText.replace(/[0-9\s.,:;()\-\/•|]/g, '').length === 0;

    if (!hasLetters && (combinedText.length === 0 || onlyIndexAndPunct)) {
      console.log(`  🗑️ Removing empty table row (content: "${combinedText}")`);
      removedCount++;
      return '';
    }
    
    return match; // Keep this row
  });
  
  console.log(`✅ [removeEmptyTableRows] Removed ${removedCount} empty table rows`);
  return result;
};


// Remove extra empty employee rows based on actual dynamic values present
// IMPORTANT: Skip this for large datasets (>15 employees) as dynamic templates handle this automatically
const removeExtraEmployeeRows = (xml: string, dynamicValues: string[], employeeCount: number = 0): string => {
  // Skip post-processing for large employee lists - dynamic templates handle unlimited rows
  if (employeeCount > 15) {
    console.log(`⚠️ [removeExtraEmployeeRows] Skipping for large dataset (${employeeCount} employees) - using dynamic template`);
    return xml;
  }

  console.log("🧹 [removeExtraEmployeeRows] Removing trailing empty employee rows using dynamic values");
  if (!dynamicValues || dynamicValues.length === 0) return xml;

  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const valuePattern = new RegExp(dynamicValues.map(v => escapeRegExp(v)).join('|'), 'i');

  const tableRegex = /<w:tbl[^>]*>[\s\S]*?<\/w:tbl>/g;
  const rowRegex = /<w:tr[^>]*>[\s\S]*?<\/w:tr>/g;
  const textRegex = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g;

  const tables = Array.from(xml.matchAll(tableRegex));
  let processed = 0;

  for (const t of tables) {
    const table = t[0];
    const rows = Array.from(table.matchAll(rowRegex)).map(m => m[0]);
    if (rows.length === 0) continue;

    // Find last row that contains any dynamic value
    let lastMatchIdx = -1;
    const rowTexts = rows.map(r => {
      const texts: string[] = [];
      let m;
      while ((m = textRegex.exec(r)) !== null) {
        texts.push((m[1] || '').replace(/\u00A0|&nbsp;/g, ' '));
      }
      textRegex.lastIndex = 0; // reset for next row
      return texts.join(' ').trim();
    });

    rowTexts.forEach((rt, idx) => {
      if (valuePattern.test(rt)) lastMatchIdx = idx;
    });

    if (lastMatchIdx >= 0 && lastMatchIdx < rows.length - 1) {
      let rowIdx = -1;
      const newTable = table.replace(rowRegex, (row) => {
        rowIdx++;
        const rtIdx = rowIdx;
        const rowText = rowTexts[rtIdx] || '';
        const isDynamic = valuePattern.test(rowText);
        if (rowIdx > lastMatchIdx && !isDynamic) {
          processed++;
          return '';
        }
        return row;
      });

      // Replace the original table with the cleaned one
      xml = xml.replace(table, newTable);
    }
  }

  console.log(`✅ [removeExtraEmployeeRows] Removed ${processed} trailing rows`);
  return xml;
};

export const generateNotaDinas = async (data: AssignmentData): Promise<void> => {
  console.log("🔵 [documentGenerator] Starting generateNotaDinas");
  console.log("🔵 [documentGenerator] Input data:", JSON.stringify(data, null, 2));
  
  // Validate input data
  if (!data) {
    throw new Error("Data dokumen tidak boleh kosong");
  }
  
  if (!data.employees || data.employees.length === 0) {
    throw new Error("Data pegawai tidak ditemukan. Minimal harus ada 1 pegawai.");
  }
  
  if (!data.pejabat_penandatangan) {
    throw new Error("Data pejabat penandatangan tidak ditemukan");
  }
  
  // Validate required fields
  const requiredFields = [
    'nomor_surat', 'perihal', 'dasar_penugasan', 'nomor_naskah_dinas', 
    'tanggal_naskah', 'tujuan', 'tempat_penugasan', 'tanggal_kegiatan'
  ];
  
  // Allow "-" as a valid value for tempat_penugasan (for "Dalam Kantor" assignments)
  const missingFields = requiredFields.filter(field => {
    const value = data[field as keyof AssignmentData];
    // For all fields, check if value is falsy (empty, null, undefined)
    // But we explicitly allow "-" for tempat_penugasan
    if (!value) return true;
    return false;
  });
  
  if (missingFields.length > 0) {
    throw new Error(`Field wajib tidak lengkap: ${missingFields.join(', ')}`);
  }
  
  // Sort employees by rank (highest to lowest)
  const employees = sortEmployeesByRank(data.employees);
  const isSmallGroup = employees.length <= 5;
  
  console.log("✅ [documentGenerator] Data validated successfully");
  console.log(`📊 [documentGenerator] Employee count: ${employees.length}, Template: ${isSmallGroup ? 'Small Group (≤5)' : 'Large Group (>5)'}`);

  // Use docxtemplater for proper template handling
  try {
    // Select template based on employee count
    const templatePath = isSmallGroup 
      ? '/templates/ND_Kegiatan_kurang_dari_sama_dengan_5_pegawai.docx'
      : '/templates/ND_Kegiatan_lebih_dari_5_pegawai.docx';

    console.log(`📄 [documentGenerator] Loading template: ${templatePath}`);

    // Load template
    const response = await fetch(templatePath);
    if (!response.ok) {
      throw new Error(`Failed to load template: ${response.statusText}`);
    }
    
    const templateBuffer = await response.arrayBuffer();
    const zip = new PizZip(templateBuffer);
    
    console.log("✅ [documentGenerator] Template loaded successfully");

    // Format dates with proper validation
    const formatTanggalNaskah = () => {
      try {
        const date = new Date(data.tanggal_naskah);
        if (isNaN(date.getTime())) {
          console.warn("⚠️ [documentGenerator] Invalid tanggal_naskah:", data.tanggal_naskah);
          return data.tanggal_naskah;
        }
        return format(date, "dd MMMM yyyy", { locale: id });
      } catch (error) {
        console.error("❌ [documentGenerator] Error formatting tanggal_naskah:", error);
        return data.tanggal_naskah;
      }
    };
    
    // Format tanggal kegiatan with day names
    const formatTanggalKegiatanWithDays = () => {
      const tanggalKegiatan = data.tanggal_kegiatan;
      const parts = tanggalKegiatan.split(' - ');
      
      if (parts.length === 2) {
        // Date range: e.g., "31 Januari 2026 - 01 Februari 2026"
        try {
          // Parse start date
          const startDateStr = parts[0].trim();
          const endDateStr = parts[1].trim();
          
          // Try to parse dates (handle "dd MMMM yyyy" format in Indonesian)
          const parseIndonesianDate = (dateStr: string): Date | null => {
            const months: { [key: string]: number } = {
              'januari': 0, 'februari': 1, 'maret': 2, 'april': 3, 'mei': 4, 'juni': 5,
              'juli': 6, 'agustus': 7, 'september': 8, 'oktober': 9, 'november': 10, 'desember': 11
            };
            const parts = dateStr.split(' ');
            if (parts.length >= 3) {
              const day = parseInt(parts[0]);
              const month = months[parts[1].toLowerCase()];
              const year = parseInt(parts[2]);
              if (!isNaN(day) && month !== undefined && !isNaN(year)) {
                return new Date(year, month, day);
              }
            }
            return null;
          };
          
          const startDate = parseIndonesianDate(startDateStr);
          const endDate = parseIndonesianDate(endDateStr);
          
          if (startDate && endDate) {
            const startDay = format(startDate, 'EEEE', { locale: id });
            const endDay = format(endDate, 'EEEE', { locale: id });
            const startFormatted = format(startDate, 'dd MMMM', { locale: id });
            const endFormatted = format(endDate, 'dd MMMM yyyy', { locale: id });
            
            // Capitalize first letter of day names
            const capitalizedStartDay = startDay.charAt(0).toUpperCase() + startDay.slice(1);
            const capitalizedEndDay = endDay.charAt(0).toUpperCase() + endDay.slice(1);
            
            // Check if same month
            if (startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()) {
              return `${capitalizedStartDay}-${capitalizedEndDay}, ${format(startDate, 'dd', { locale: id })} - ${format(endDate, 'dd MMMM yyyy', { locale: id })}`;
            } else {
              return `${capitalizedStartDay}-${capitalizedEndDay}, ${startFormatted} - ${endFormatted}`;
            }
          }
        } catch (error) {
          console.warn("⚠️ [documentGenerator] Error parsing date range:", error);
        }
        return tanggalKegiatan;
      } else {
        // Single date
        try {
          const parseIndonesianDate = (dateStr: string): Date | null => {
            const months: { [key: string]: number } = {
              'januari': 0, 'februari': 1, 'maret': 2, 'april': 3, 'mei': 4, 'juni': 5,
              'juli': 6, 'agustus': 7, 'september': 8, 'oktober': 9, 'november': 10, 'desember': 11
            };
            const parts = dateStr.trim().split(' ');
            if (parts.length >= 3) {
              const day = parseInt(parts[0]);
              const month = months[parts[1].toLowerCase()];
              const year = parseInt(parts[2]);
              if (!isNaN(day) && month !== undefined && !isNaN(year)) {
                return new Date(year, month, day);
              }
            }
            return null;
          };
          
          const date = parseIndonesianDate(tanggalKegiatan);
          if (date) {
            const dayName = format(date, 'EEEE', { locale: id });
            const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
            return `${capitalizedDay}, ${format(date, 'dd MMMM yyyy', { locale: id })}`;
          }
        } catch (error) {
          console.warn("⚠️ [documentGenerator] Error parsing single date:", error);
        }
        return tanggalKegiatan;
      }
    };

    // Initialize docxtemplater (using default delimiters { })
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Prepare employee data - map to array for docxtemplater loop
    const employeeList = employees.map((emp, index) => {
      console.log(`  ${index + 1}. ${emp.nm_pegawai} - ${emp.uraian_pangkat} - ${emp.uraian_jabatan}`);
      
      // Apply proper case formatting
      const namaProper = toProperCase(emp.nm_pegawai || '');
      const pangkatProper = toProperCase(emp.uraian_pangkat || '');
      const golRuangProper = emp.gol_ruang ? toProperCase(emp.gol_ruang) : '';
      const pangkatLengkap = formatPangkatSeparator(golRuangProper ? `${pangkatProper} / ${golRuangProper}` : pangkatProper);
      const jabatanProper = cleanJabatanForDocument(toProperCase(emp.uraian_jabatan || ''));
      
      return {
        index: index + 1,
        nama: namaProper,
        pangkat: pangkatLengkap,
        jabatan: jabatanProper,
        // Also provide individual placeholders for first employee (legacy support)
        ...(index === 0 ? {
          'Nama Lengkap Pegawai': namaProper,
          'Pangkat/Gol Ruang Pegawai': pangkatLengkap,
          'Jabatan Pegawai': jabatanProper
        } : {})
      };
    });

    // Dynamic values to detect real rows in post-processing
    const dynamicEmployeeValues = employees.flatMap(emp => [
      emp.nm_pegawai || '',
      `${emp.uraian_pangkat || ''}${emp.gol_ruang ? ' / ' + emp.gol_ruang : ''}`,
      emp.uraian_jabatan || ''
    ]).filter(v => v && v.trim().length > 0);

    // Helper function to create case variations for a key-value pair
    const addCaseVariations = (obj: Record<string, string>, baseKey: string, value: string) => {
      // Original
      obj[baseKey] = value;
      // lowercase
      obj[baseKey.toLowerCase()] = value;
      // UPPERCASE
      obj[baseKey.toUpperCase()] = value;
      // Smart Title Case: preserve acronyms (words with 2 or fewer letters)
      const titleCase = baseKey.split(' ').map(word => {
        if (word.length <= 2) {
          return word.toUpperCase(); // Keep acronyms uppercase (ND, ST, etc)
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }).join(' ');
      obj[titleCase] = value;
    };

    // Format tanggal surat
    const formattedTanggalSurat = format(data.tanggal_surat, "dd MMMM yyyy", { locale: id });

    // For templates that use single placeholders, use first employee
    const firstEmployee = employees[0];

    // Set all data for replacement with multiple case variations
    const templateData: Record<string, any> = {};
    
    // Document information
    addCaseVariations(templateData, "nomor nd", data.nomor_surat || '');
    addCaseVariations(templateData, "nomor surat", data.nomor_surat || '');
    addCaseVariations(templateData, "tanggal surat", formattedTanggalSurat);
    
    // Unit information
    addCaseVariations(templateData, "unit penerbit", data.unit_penerbit || '');
    addCaseVariations(templateData, "unit pemohon", data.unit_pemohon || '');
    
    // Activity information
    addCaseVariations(templateData, "nama kegiatan", data.perihal || '');
    addCaseVariations(templateData, "dasar penugasan", data.dasar_penugasan || '');
    addCaseVariations(templateData, "kondiseran naskah dinas", data.dasar_penugasan || '');
    addCaseVariations(templateData, "nomor naskah dinas", data.nomor_naskah_dinas || '');
    addCaseVariations(templateData, "tanggal naskah dinas", formatTanggalNaskah());
    addCaseVariations(templateData, "perihal", data.perihal || '');
    addCaseVariations(templateData, "perihal naskah dinas", data.perihal || '');
    
    // Assignment details
    addCaseVariations(templateData, "tujuan penugasan", data.tujuan || '');
    addCaseVariations(templateData, "tanggal kegiatan", formatTanggalKegiatanWithDays());
    addCaseVariations(templateData, "hari, tanggal kegiatan berlangsung mulai-akhir", formatTanggalKegiatanWithDays());
    addCaseVariations(templateData, "hari, tanggal kegiatan berlangsung mulai-selesai", formatTanggalKegiatanWithDays());
    addCaseVariations(templateData, "waktu penugasan", data.waktu_penugasan || '');
    addCaseVariations(templateData, "tempat penugasan", data.tempat_penugasan || '');
    addCaseVariations(templateData, "alamat penugasan", data.alamat_penugasan || '');
    
    // Signatory information
    addCaseVariations(templateData, "pejabat penandatangan", data.pejabat_penandatangan?.nm_pegawai || '');
    addCaseVariations(templateData, "pejabat penandatangan unit pemohon", data.pejabat_penandatangan?.nm_pegawai || '');
    addCaseVariations(templateData, "pangkat pejabat", data.pejabat_penandatangan?.uraian_pangkat || '');
    addCaseVariations(templateData, "jabatan pejabat", data.pejabat_penandatangan?.uraian_jabatan || '');
    
    // Individual employee placeholders for templates with manual entries (≤5 employees)
    employees.forEach((emp, index) => {
      const num = index + 1;
      const namaProper = toProperCase(emp.nm_pegawai || '');
      const pangkatProper = toProperCase(emp.uraian_pangkat || '');
      const golRuangProper = emp.gol_ruang ? toProperCase(emp.gol_ruang) : '';
      const pangkatLengkap = formatPangkatSeparator(golRuangProper ? `${pangkatProper} / ${golRuangProper}` : pangkatProper);
      const jabatanProper = cleanJabatanForDocument(toProperCase(emp.uraian_jabatan || ''));
      
      addCaseVariations(templateData, `nama pegawai ${num}`, namaProper);
      addCaseVariations(templateData, `pangkat pegawai ${num}`, pangkatLengkap);
      addCaseVariations(templateData, `jabatan pegawai ${num}`, jabatanProper);
    });
    
    // Add conditional flags for template conditionals (to hide unused employee slots)
    templateData.hasEmployee2 = employees.length >= 2;
    templateData.hasEmployee3 = employees.length >= 3;
    templateData.hasEmployee4 = employees.length >= 4;
    templateData.hasEmployee5 = employees.length >= 5;
    
    // Fill remaining employee slots with empty strings (for templates with fixed slots)
    // Template for ≤5 employees typically has placeholders for up to 5 employees
    const maxEmployeeSlots = 5;
    for (let i = employees.length + 1; i <= maxEmployeeSlots; i++) {
      addCaseVariations(templateData, `nama pegawai ${i}`, '');
      addCaseVariations(templateData, `pangkat pegawai ${i}`, '');
      addCaseVariations(templateData, `jabatan pegawai ${i}`, '');
    }
    
    console.log("📝 [documentGenerator] Employee placeholders filled:");
    console.log(`  - Active employees: 1 to ${employees.length}`);
    console.log(`  - Empty placeholders: ${employees.length + 1} to ${maxEmployeeSlots}`);
    
    // First employee data for single-placeholder templates (legacy support)
    const firstEmpNamaProper = firstEmployee ? toProperCase(firstEmployee.nm_pegawai || '') : '';
    const firstEmpPangkatProper = firstEmployee ? toProperCase(firstEmployee.uraian_pangkat || '') : '';
    const firstEmpGolRuangProper = firstEmployee?.gol_ruang ? toProperCase(firstEmployee.gol_ruang) : '';
    const firstEmpPangkatLengkap = formatPangkatSeparator(firstEmpGolRuangProper ? `${firstEmpPangkatProper} / ${firstEmpGolRuangProper}` : firstEmpPangkatProper);
    const firstEmpJabatanProper = firstEmployee ? cleanJabatanForDocument(toProperCase(firstEmployee.uraian_jabatan || '')) : '';
    
    addCaseVariations(templateData, "nama lengkap pegawai", firstEmpNamaProper);
    addCaseVariations(templateData, "pangkat/gol ruang pegawai", firstEmpPangkatLengkap);
    addCaseVariations(templateData, "jabatan pegawai", firstEmpJabatanProper);
    
    // Employee array for loop-based templates
    templateData.employees = employeeList;
    
    console.log("📝 [documentGenerator] Template data prepared:", Object.keys(templateData).length, "keys");
    console.log("📝 [documentGenerator] Sample values:");
    console.log("  - nomor nd:", templateData["nomor nd"]);
    console.log("  - tanggal surat:", templateData["tanggal surat"]);
    console.log("  - unit pemohon:", templateData["unit pemohon"]);
    console.log("  - nama kegiatan:", templateData["nama kegiatan"]);
    console.log("  - waktu penugasan:", templateData["waktu penugasan"]);
    console.log("  - nama pegawai 1:", templateData["nama pegawai 1"]);
    console.log("  - pangkat pejabat:", templateData["pangkat pejabat"]);
    console.log("  - jabatan pejabat:", templateData["jabatan pejabat"]);
    
    // Try to render the document
    try {
      doc.render(templateData);
      console.log("✅ [documentGenerator] Document rendered successfully with docxtemplater");
    } catch (error) {
      console.error("❌ [documentGenerator] Docxtemplater render failed:", error);
      throw new Error(`Template rendering failed: ${error.message}`);
    }

    // Generate output
    const output = doc.getZip().generate({
      type: "blob",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    console.log("💾 [documentGenerator] Triggering download");
    
    // Trigger download
    const filename = `Nota_Dinas_${data.nomor_surat.replace(/\//g, '_')}.docx`;
    saveAs(output, filename);
    
    console.log(`✅ [documentGenerator] Document generated successfully: ${filename}`);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    return;
    
  } catch (error) {
    console.error("❌ [documentGenerator] Error generating from template:", error);
    if (error instanceof Error) {
      throw new Error(`Gagal generate dokumen: ${error.message}`);
    }
    throw error;
  }

  // Original code as fallback

  const children: any[] = [];

  // Header - Ministry info
  children.push(
    new Paragraph({
      text: "KEMENTERIAN KEUANGAN REPUBLIK INDONESIA",
      alignment: AlignmentType.CENTER,
      spacing: { after: 50 },
    }),
    new Paragraph({
      text: "DIREKTORAT JENDERAL BEA DAN CUKAI",
      alignment: AlignmentType.CENTER,
      spacing: { after: 50 },
      style: "Heading1",
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "KANTOR WILAYAH DIREKTORAT JENDERAL BEA DAN CUKAI JAWA TIMUR I",
          bold: true,
          color: "0563C1",
          underline: {
            type: UnderlineType.SINGLE,
          },
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    })
  );

  // Address and contact info
  children.push(
    new Paragraph({
      text: "JALAN RAYA BANDARA JUANDA NOMOR 39, DESA SEMAMBUNG, SIDOARJO 61254",
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
    }),
    new Paragraph({
      text: "TELEPON (031) 8675356; FAKSIMILE (031) 8675335; LAMAN kanwiljatim1.beacukai.go.id",
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
    }),
    new Paragraph({
      text: "PUSAT KONTAK LAYANAN 1500225; SUREL kwbcjatim1@customs.go.id",
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
    new Paragraph({
      text: "",
      border: {
        bottom: {
          color: "000000",
          space: 1,
          style: BorderStyle.SINGLE,
          size: 20,
        },
      },
      spacing: { after: 200 },
    })
  );

  // Title - NOTA DINAS
  children.push(
    new Paragraph({
      text: "NOTA DINAS",
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      style: "Heading1",
    }),
    new Paragraph({
      text: `NOMOR ${data.nomor_surat}`,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    })
  );

  // Format berbeda berdasarkan jumlah pegawai
  if (isSmallGroup) {
    // Template untuk pegawai ≤ 5
    // Format table untuk header info
    const headerInfoTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
        insideHorizontal: { style: BorderStyle.NONE },
        insideVertical: { style: BorderStyle.NONE },
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 15, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [new Paragraph({ text: "Yth" })],
            }),
            new TableCell({
              width: { size: 85, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [new Paragraph({ text: `:     ${data.unit_penerbit || ''}` })],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [new Paragraph({ text: "Dari" })],
            }),
            new TableCell({
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [new Paragraph({ text: `:     ${data.unit_pemohon || ''}` })],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [new Paragraph({ text: "Sifat" })],
            }),
            new TableCell({
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [new Paragraph({ text: ":" })],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [new Paragraph({ text: "Hal" })],
            }),
            new TableCell({
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [new Paragraph({ text: `:     Permohonan Penerbitan ST ${data.perihal}` })],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [new Paragraph({ text: "Tanggal" })],
            }),
            new TableCell({
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [new Paragraph({ text: `:     ${format(data.tanggal_surat, "dd MMMM yyyy", { locale: id })}` })],
            }),
          ],
        }),
      ],
    });
    
    children.push(headerInfoTable);
    
    children.push(
      new Paragraph({
        text: "",
        border: {
          bottom: {
            color: "000000",
            space: 1,
            style: BorderStyle.SINGLE,
            size: 6,
          },
        },
        spacing: { after: 200, before: 100 },
      })
    );

    // Body paragraph
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Sehubungan dengan ",
          }),
          new TextRun({
            text: data.dasar_penugasan,
          }),
          new TextRun({
            text: " ",
          }),
          new TextRun({
            text: data.nomor_naskah_dinas,
          }),
          new TextRun({
            text: " ",
          }),
          new TextRun({
            text: data.tanggal_naskah,
          }),
          new TextRun({
            text: " ",
          }),
          new TextRun({
            text: data.perihal,
          }),
          new TextRun({
            text: ", dengan hormat kami sampaikan permohonan penerbitan Surat Tugas atas pegawai sebagai berikut :",
          }),
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 200 },
      })
    );

    // Employee list
    employees.forEach((emp, index) => {
      children.push(
        new Paragraph({
          text: `${index + 1}. nama                  :  ${emp.nm_pegawai}`,
          spacing: { after: 50 },
          indent: { left: convertInchesToTwip(0.5) },
        }),
        new Paragraph({
          text: `    pangkat/gol. ruang     :  ${emp.uraian_pangkat}${emp.gol_ruang ? ' / ' + emp.gol_ruang : ''}`,
          spacing: { after: 50 },
          indent: { left: convertInchesToTwip(0.5) },
        }),
        new Paragraph({
          text: `    jabatan                :  ${emp.uraian_jabatan}`,
          spacing: { after: 150 },
          indent: { left: convertInchesToTwip(0.5) },
        })
      );
    });
  } else {
    // Template untuk pegawai > 5
    // Format table yang lebih kompak untuk banyak pegawai
    const headerInfoTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
        insideHorizontal: { style: BorderStyle.NONE },
        insideVertical: { style: BorderStyle.NONE },
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 15, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [new Paragraph({ text: "Yth" })],
            }),
            new TableCell({
              width: { size: 85, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [new Paragraph({ text: `:     ${data.unit_penerbit || ''}` })],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [new Paragraph({ text: "Dari" })],
            }),
            new TableCell({
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [new Paragraph({ text: `:     ${data.unit_pemohon || ''}` })],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [new Paragraph({ text: "Sifat" })],
            }),
            new TableCell({
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [new Paragraph({ text: ":" })],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [new Paragraph({ text: "Hal" })],
            }),
            new TableCell({
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [new Paragraph({ text: `:     Permohonan Penerbitan ST ${data.perihal}` })],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [new Paragraph({ text: "Tanggal" })],
            }),
            new TableCell({
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [new Paragraph({ text: `:     ${format(data.tanggal_surat, "dd MMMM yyyy", { locale: id })}` })],
            }),
          ],
        }),
      ],
    });
    
    children.push(headerInfoTable);
    
    children.push(
      new Paragraph({
        text: "",
        border: {
          bottom: {
            color: "000000",
            space: 1,
            style: BorderStyle.SINGLE,
            size: 6,
          },
        },
        spacing: { after: 200, before: 100 },
      })
    );

    // Body paragraph untuk > 5 pegawai
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Sehubungan dengan ",
          }),
          new TextRun({
            text: data.dasar_penugasan,
          }),
          new TextRun({
            text: " ",
          }),
          new TextRun({
            text: data.nomor_naskah_dinas,
          }),
          new TextRun({
            text: " ",
          }),
          new TextRun({
            text: data.tanggal_naskah,
          }),
          new TextRun({
            text: " ",
          }),
          new TextRun({
            text: data.perihal,
          }),
          new TextRun({
            text: ", dengan hormat kami sampaikan permohonan penerbitan Surat Tugas atas pegawai sebagai berikut :",
          }),
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 200 },
      })
    );

    // Employee list sebagai tabel untuk > 5 pegawai
    const employeeTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 8, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: "No", bold: true })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 42, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: "Nama", bold: true })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 25, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: "Pangkat/Gol. Ruang", bold: true })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 25, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: "Jabatan", bold: true })],
                }),
              ],
            }),
          ],
        }),
        ...employees.map((emp, index) =>
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ text: String(index + 1) })] }),
              new TableCell({ children: [new Paragraph({ text: emp.nm_pegawai })] }),
              new TableCell({ children: [new Paragraph({ text: `${emp.uraian_pangkat}${emp.gol_ruang ? ' / ' + emp.gol_ruang : ''}` })] }),
              new TableCell({ children: [new Paragraph({ text: emp.uraian_jabatan })] }),
            ],
          })
        ),
      ],
    });
    
    children.push(employeeTable);
    children.push(new Paragraph({ text: "", spacing: { after: 200 } }));
  }

  // Tujuan dan detail (sama untuk kedua template)
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Untuk ",
        }),
        new TextRun({
          text: data.tujuan,
        }),
        new TextRun({
          text: " yang dilaksanakan pada :",
        }),
      ],
      spacing: { after: 100 },
    }),
    new Paragraph({
      text: `hari,tanggal     :  ${data.tanggal_kegiatan}`,
      spacing: { after: 50 },
    }),
    new Paragraph({
      text: `tempat           :  ${data.tempat_penugasan}`,
      spacing: { after: data.alamat_penugasan ? 50 : 200 },
    })
  );

  if (data.alamat_penugasan) {
    children.push(
      new Paragraph({
        text: data.alamat_penugasan,
        spacing: { after: 200 },
      })
    );
  }

  // Closing
  children.push(
    new Paragraph({
      text: "Demikian disampaikan, untuk mendapatkan arahan lebih lanjut.",
      spacing: { after: 200 },
    })
  );

  // Add 6 blank lines before "Ditandatangani secara elektronik"
  for (let i = 0; i < 6; i++) {
    children.push(
      new Paragraph({
        text: "",
        spacing: { after: 0 },
      })
    );
  }

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Ditandatangani secara elektronik",
          italics: true,
          color: "999999",
        }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: data.pejabat_penandatangan.nm_pegawai,
          bold: true,
        }),
      ],
      spacing: { after: 300 },
    })
  );

  // Tembusan
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Tembusan:",
          bold: true,
        }),
      ],
      spacing: { after: 100 },
    }),
    new Paragraph({
      text: "1. Kepala Bagian Umum",
      spacing: { after: 50 },
    })
  );

  const doc = new Document({
    sections: [{
      properties: {},
      children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Nota_Dinas_${data.nomor_surat.replace(/\//g, '_')}.docx`);
};

export const generateSuratTugas = async (data: AssignmentData): Promise<void> => {
  console.log("🔵 [documentGenerator] Starting generateSuratTugas");
  console.log("🔵 [documentGenerator] Input data:", JSON.stringify(data, null, 2));
  
  // Validate input data
  if (!data) {
    throw new Error("Data dokumen tidak boleh kosong");
  }
  
  if (!data.employees || data.employees.length === 0) {
    throw new Error("Data pegawai tidak ditemukan. Minimal harus ada 1 pegawai.");
  }
  
  if (!data.pejabat_penandatangan) {
    throw new Error("Data pejabat penandatangan tidak ditemukan");
  }
  
  // Validate required fields
  const requiredFields = [
    'nomor_surat', 'perihal', 'dasar_penugasan', 'nomor_naskah_dinas', 
    'tanggal_naskah', 'tujuan', 'tempat_penugasan', 'tanggal_kegiatan'
  ];
  
  // Allow "-" as a valid value for tempat_penugasan (for "Dalam Kantor" assignments)
  const missingFields = requiredFields.filter(field => {
    const value = data[field as keyof AssignmentData];
    // For all fields, check if value is falsy (empty, null, undefined)
    // But we explicitly allow "-" for tempat_penugasan
    if (!value) return true;
    return false;
  });
  
  if (missingFields.length > 0) {
    throw new Error(`Field wajib tidak lengkap: ${missingFields.join(', ')}`);
  }
  
  // Sort employees by rank (highest to lowest)
  const employees = sortEmployeesByRank(data.employees);
  const isSmallGroup = employees.length <= 5;
  
  console.log("✅ [documentGenerator] Data validated successfully");
  console.log(`📊 [documentGenerator] Employee count: ${employees.length}, Template: ${isSmallGroup ? 'Small Group (≤5)' : 'Large Group (>5)'}`);

  // Use docxtemplater for proper template handling
  try {
    // Select template based on employee count
    const templatePath = isSmallGroup 
      ? '/templates/ST_Kegiatan_kurang_dari_sama_dengan_5_pegawai.docx'
      : '/templates/ST_Kegiatan_lebih_dari_5_pegawai.docx';

    console.log(`📄 [documentGenerator] Loading template: ${templatePath}`);

    // Load template
    const response = await fetch(templatePath);
    if (!response.ok) {
      throw new Error(`Failed to load template: ${response.statusText}`);
    }
    
    const templateBuffer = await response.arrayBuffer();
    const zip = new PizZip(templateBuffer);
    
    console.log("✅ [documentGenerator] Template loaded successfully");

    // Format dates with proper validation
    const formatTanggalNaskah = () => {
      try {
        const date = new Date(data.tanggal_naskah);
        if (isNaN(date.getTime())) {
          console.warn("⚠️ [documentGenerator] Invalid tanggal_naskah:", data.tanggal_naskah);
          return data.tanggal_naskah;
        }
        return format(date, "dd MMMM yyyy", { locale: id });
      } catch (error) {
        console.error("❌ [documentGenerator] Error formatting tanggal_naskah:", error);
        return data.tanggal_naskah;
      }
    };
    
    // Format tanggal kegiatan with day names
    const formatTanggalKegiatanWithDays = () => {
      const tanggalKegiatan = data.tanggal_kegiatan;
      const parts = tanggalKegiatan.split(' - ');
      
      if (parts.length === 2) {
        // Date range: e.g., "31 Januari 2026 - 01 Februari 2026"
        try {
          // Parse start date
          const startDateStr = parts[0].trim();
          const endDateStr = parts[1].trim();
          
          // Try to parse dates (handle "dd MMMM yyyy" format in Indonesian)
          const parseIndonesianDate = (dateStr: string): Date | null => {
            const months: { [key: string]: number } = {
              'januari': 0, 'februari': 1, 'maret': 2, 'april': 3, 'mei': 4, 'juni': 5,
              'juli': 6, 'agustus': 7, 'september': 8, 'oktober': 9, 'november': 10, 'desember': 11
            };
            const parts = dateStr.split(' ');
            if (parts.length >= 3) {
              const day = parseInt(parts[0]);
              const month = months[parts[1].toLowerCase()];
              const year = parseInt(parts[2]);
              if (!isNaN(day) && month !== undefined && !isNaN(year)) {
                return new Date(year, month, day);
              }
            }
            return null;
          };
          
          const startDate = parseIndonesianDate(startDateStr);
          const endDate = parseIndonesianDate(endDateStr);
          
          if (startDate && endDate) {
            const startDay = format(startDate, 'EEEE', { locale: id });
            const endDay = format(endDate, 'EEEE', { locale: id });
            const startFormatted = format(startDate, 'dd MMMM', { locale: id });
            const endFormatted = format(endDate, 'dd MMMM yyyy', { locale: id });
            
            // Capitalize first letter of day names
            const capitalizedStartDay = startDay.charAt(0).toUpperCase() + startDay.slice(1);
            const capitalizedEndDay = endDay.charAt(0).toUpperCase() + endDay.slice(1);
            
            // Check if same month
            if (startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()) {
              return `${capitalizedStartDay}-${capitalizedEndDay}, ${format(startDate, 'dd', { locale: id })} - ${format(endDate, 'dd MMMM yyyy', { locale: id })}`;
            } else {
              return `${capitalizedStartDay}-${capitalizedEndDay}, ${startFormatted} - ${endFormatted}`;
            }
          }
        } catch (error) {
          console.warn("⚠️ [documentGenerator] Error parsing date range:", error);
        }
        return tanggalKegiatan;
      } else {
        // Single date
        try {
          const parseIndonesianDate = (dateStr: string): Date | null => {
            const months: { [key: string]: number } = {
              'januari': 0, 'februari': 1, 'maret': 2, 'april': 3, 'mei': 4, 'juni': 5,
              'juli': 6, 'agustus': 7, 'september': 8, 'oktober': 9, 'november': 10, 'desember': 11
            };
            const parts = dateStr.trim().split(' ');
            if (parts.length >= 3) {
              const day = parseInt(parts[0]);
              const month = months[parts[1].toLowerCase()];
              const year = parseInt(parts[2]);
              if (!isNaN(day) && month !== undefined && !isNaN(year)) {
                return new Date(year, month, day);
              }
            }
            return null;
          };
          
          const date = parseIndonesianDate(tanggalKegiatan);
          if (date) {
            const dayName = format(date, 'EEEE', { locale: id });
            const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
            return `${capitalizedDay}, ${format(date, 'dd MMMM yyyy', { locale: id })}`;
          }
        } catch (error) {
          console.warn("⚠️ [documentGenerator] Error parsing single date:", error);
        }
        return tanggalKegiatan;
      }
    };

    // Initialize docxtemplater (using default delimiters { })
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Prepare employee data - map to array for docxtemplater loop
    const employeeList = employees.map((emp, index) => {
      console.log(`  ${index + 1}. ${emp.nm_pegawai} - ${emp.uraian_pangkat} - ${emp.uraian_jabatan}`);
      
      // Apply proper case formatting
      const namaProper = toProperCase(emp.nm_pegawai || '');
      const pangkatProper = toProperCase(emp.uraian_pangkat || '');
      const golRuangProper = emp.gol_ruang ? toProperCase(emp.gol_ruang) : '';
      const pangkatLengkap = formatPangkatSeparator(golRuangProper ? `${pangkatProper} / ${golRuangProper}` : pangkatProper);
      const jabatanProper = cleanJabatanForDocument(toProperCase(emp.uraian_jabatan || ''));
      
      return {
        index: index + 1,
        nama: namaProper,
        pangkat: pangkatLengkap,
        jabatan: jabatanProper,
      };
    });

    // Dynamic values to detect real rows in post-processing
    const dynamicEmployeeValues = employees.flatMap(emp => [
      emp.nm_pegawai || '',
      `${emp.uraian_pangkat || ''}${emp.gol_ruang ? ' / ' + emp.gol_ruang : ''}`,
      emp.uraian_jabatan || ''
    ]).filter(v => v && v.trim().length > 0);

    // Helper function to create case variations for a key-value pair
    const addCaseVariations = (obj: Record<string, string>, baseKey: string, value: string) => {
      // Original
      obj[baseKey] = value;
      // lowercase
      obj[baseKey.toLowerCase()] = value;
      // UPPERCASE
      obj[baseKey.toUpperCase()] = value;
      // Smart Title Case: preserve acronyms (words with 2 or fewer letters)
      const titleCase = baseKey.split(' ').map(word => {
        if (word.length <= 2) {
          return word.toUpperCase(); // Keep acronyms uppercase (ND, ST, etc)
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }).join(' ');
      obj[titleCase] = value;
      
      // Special case: Preserve known acronyms (DIPA, ST, ND) while capitalizing other words
      const knownAcronyms = ['DIPA', 'ST', 'ND', 'NIP'];
      const specialCase = baseKey.split(' ').map(word => {
        const upperWord = word.toUpperCase();
        if (knownAcronyms.includes(upperWord)) {
          return upperWord;
        }
        if (word.length <= 2) {
          return word.toUpperCase();
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }).join(' ');
      obj[specialCase] = value;
    };

    // Format tanggal surat
    const formattedTanggalSurat = format(data.tanggal_surat, "dd MMMM yyyy", { locale: id });

    // Set all data for replacement with multiple case variations
    const templateData: Record<string, any> = {};
    
    // Document information
    addCaseVariations(templateData, "nomor st", data.nomor_surat || '');
    addCaseVariations(templateData, "nomor surat", data.nomor_surat || '');
    addCaseVariations(templateData, "tanggal surat", formattedTanggalSurat);
    
    // Activity information
    addCaseVariations(templateData, "dasar penugasan", data.dasar_penugasan || '');
    addCaseVariations(templateData, "nomor naskah dinas", data.nomor_naskah_dinas || '');
    addCaseVariations(templateData, "tanggal naskah dinas", formatTanggalNaskah());
    addCaseVariations(templateData, "perihal", data.perihal || '');
    
    // Assignment details
    addCaseVariations(templateData, "tujuan penugasan", data.tujuan || '');
    addCaseVariations(templateData, "tanggal kegiatan", formatTanggalKegiatanWithDays());
    addCaseVariations(templateData, "hari, tanggal kegiatan berlangsung mulai-akhir", formatTanggalKegiatanWithDays());
    addCaseVariations(templateData, "hari, tanggal kegiatan berlangsung mulai-selesai", formatTanggalKegiatanWithDays());
    addCaseVariations(templateData, "waktu", data.waktu_penugasan || '');
    addCaseVariations(templateData, "waktu penugasan", data.waktu_penugasan || '');
    addCaseVariations(templateData, "jam penugasan", data.waktu_penugasan || '');
    addCaseVariations(templateData, "tempat penugasan", data.tempat_penugasan || '');
    addCaseVariations(templateData, "alamat penugasan", data.alamat_penugasan || '');
    
    // Conditional DIPA/Non-DIPA sentence based on sumber - dynamic year
    const currentYear = new Date().getFullYear();
    let kalimatBiayaDIPA = '';
    
    if (data.sumber === 'DIPA') {
      const sumberSatker = data.sumber_satuan_kerja || '';
      const sumberSatkerCustom = data.sumber_satuan_kerja_custom || '';
      
      // DIPA + Kanwil DJBC Jawa Timur I + Kanwil office selected
      if (sumberSatker === 'Kanwil DJBC Jatim I') {
        kalimatBiayaDIPA = `Segala biaya yang timbul sebagai akibat dilaksanakannya surat tugas ini dapat dibebankan pada DIPA Kantor Wilayah DJBC Jawa Timur I Tahun Anggaran ${currentYear} dan pelaksanaannya menggunakan sistem E-perjadin sehingga peserta perjalanan dinas wajib melakukan geotagging pada aplikasi satu kemenkeu sesuai dengan Keputusan Menteri Keuangan Nomor 176 Tahun 2024`;
      }
      // DIPA + Kanwil DJBC Jawa Timur I + Other KPPBC offices (Tanjung Perak, Juanda, etc.)
      else if (sumberSatker && sumberSatker.startsWith('KPPBC') || sumberSatker === 'BLBC Kelas II Surabaya') {
        kalimatBiayaDIPA = `Segala biaya yang timbul sebagai akibat dilaksanakannya surat tugas ini dapat dibebankan pada DIPA ${sumberSatker} Tahun Anggaran ${currentYear} dan pelaksanaannya menggunakan sistem E-perjadin sehingga peserta perjalanan dinas wajib melakukan geotagging pada aplikasi satu kemenkeu sesuai dengan Keputusan Menteri Keuangan Nomor 176 Tahun 2024`;
      }
      // DIPA + Kantor Pusat (direktorat options like Sekretariat DJBC, Direktorat Audit, etc.)
      else if (sumberSatker && (sumberSatker.includes('Sekretariat') || sumberSatker.includes('Direktorat'))) {
        kalimatBiayaDIPA = `Segala biaya yang timbul sebagai akibat dilaksanakannya surat tugas ini dapat dibebankan pada DIPA ${sumberSatker} Tahun Anggaran ${currentYear} dan pelaksanaannya menggunakan sistem E-perjadin sehingga peserta perjalanan dinas wajib melakukan geotagging pada aplikasi satu kemenkeu sesuai dengan Keputusan Menteri Keuangan Nomor 176 Tahun 2024`;
      }
      // DIPA + Lain-lain (custom text input)
      else if (sumberSatkerCustom) {
        kalimatBiayaDIPA = `Segala biaya yang timbul sebagai akibat dilaksanakannya surat tugas ini dapat dibebankan pada DIPA ${sumberSatkerCustom} Tahun Anggaran ${currentYear} dan pelaksanaannya menggunakan sistem E-perjadin sehingga peserta perjalanan dinas wajib melakukan geotagging pada aplikasi satu kemenkeu sesuai dengan Keputusan Menteri Keuangan Nomor 176 Tahun 2024`;
      }
      // Fallback to default Kanwil
      else {
        kalimatBiayaDIPA = `Segala biaya yang timbul sebagai akibat dilaksanakannya surat tugas ini dapat dibebankan pada DIPA Kantor Wilayah DJBC Jawa Timur I Tahun Anggaran ${currentYear} dan pelaksanaannya menggunakan sistem E-perjadin sehingga peserta perjalanan dinas wajib melakukan geotagging pada aplikasi satu kemenkeu sesuai dengan Keputusan Menteri Keuangan Nomor 176 Tahun 2024`;
      }
    } else if (data.sumber === 'Non DIPA') {
      const sumberSatker = data.sumber_satuan_kerja || '';
      const sumberSatkerCustom = data.sumber_satuan_kerja_custom || '';
      
      // Non DIPA - Handle DBHCHT vs lain-lain differently
      if (sumberSatker === 'DBHCHT') {
        // DBHCHT: "Anggaran DBHCHT Tahun Anggaran 2026"
        kalimatBiayaDIPA = `Segala biaya yang timbul sebagai akibat dilaksanakannya surat tugas ini dapat dibebankan pada Anggaran DBHCHT Tahun Anggaran ${currentYear} dan pelaksanaannya menggunakan sistem E-perjadin sehingga peserta perjalanan dinas wajib melakukan geotagging pada aplikasi satu kemenkeu sesuai dengan Keputusan Menteri Keuangan Nomor 176 Tahun 2024`;
      } else if (sumberSatkerCustom && sumberSatkerCustom.trim() !== '') {
        // Lain-lain with custom text: "Anggaran [CustomText] Tahun Anggaran 2026"
        kalimatBiayaDIPA = `Segala biaya yang timbul sebagai akibat dilaksanakannya surat tugas ini dapat dibebankan pada Anggaran ${sumberSatkerCustom.trim()} Tahun Anggaran ${currentYear} dan pelaksanaannya menggunakan sistem E-perjadin sehingga peserta perjalanan dinas wajib melakukan geotagging pada aplikasi satu kemenkeu sesuai dengan Keputusan Menteri Keuangan Nomor 176 Tahun 2024`;
      } else {
        // Fallback - should not happen with proper form validation
        kalimatBiayaDIPA = `Segala biaya yang timbul sebagai akibat dilaksanakannya surat tugas ini dapat dibebankan pada Anggaran Dana Non DIPA Tahun Anggaran ${currentYear} dan pelaksanaannya menggunakan sistem E-perjadin sehingga peserta perjalanan dinas wajib melakukan geotagging pada aplikasi satu kemenkeu sesuai dengan Keputusan Menteri Keuangan Nomor 176 Tahun 2024`;
      }
    }
    
    addCaseVariations(templateData, "kalimat biaya dipa", kalimatBiayaDIPA);
    
    // Signatory information
    const isSubUnsurAudit = (data.unit_penerbit || '').includes('Sub Unsur Audit');
    
    // For Sub Unsur Audit, use special signature format
    if (isSubUnsurAudit) {
      addCaseVariations(templateData, "pejabat penandatangan", "UNTUNG BASUKI");
      addCaseVariations(templateData, "nip pejabat", data.pejabat_penandatangan?.nip || '-');
      // Add special signature lines for Sub Unsur Audit
      templateData["Signature Line 1"] = "Direktur Jenderal Bea dan Cukai";
      templateData["Signature Line 2"] = "            u.b.";
      templateData["Signature Line 3"] = "Kepala Kantor Wilayah";
      templateData["Signature Line 4"] = "Direktorat Jenderal Bea dan Cukai";
      templateData["Signature Line 5"] = "Jawa Timur I";
    } else {
      addCaseVariations(templateData, "pejabat penandatangan", data.pejabat_penandatangan?.nm_pegawai || '');
      addCaseVariations(templateData, "nip pejabat", data.pejabat_penandatangan?.nip || '-');
      // Standard signature format
      templateData["Signature Line 1"] = "Kepala Kantor Wilayah";
      templateData["Signature Line 2"] = "Direktorat Jenderal Bea dan Cukai";
      templateData["Signature Line 3"] = "Jawa Timur I";
      templateData["Signature Line 4"] = "";
      templateData["Signature Line 5"] = "";
    }
    
    // Individual employee placeholders for templates with manual entries (≤5 employees)
    employees.forEach((emp, index) => {
      const num = index + 1;
      const namaProper = toProperCase(emp.nm_pegawai || '');
      const pangkatProper = toProperCase(emp.uraian_pangkat || '');
      const golRuangProper = emp.gol_ruang ? toProperCase(emp.gol_ruang) : '';
      const pangkatLengkap = formatPangkatSeparator(golRuangProper ? `${pangkatProper} / ${golRuangProper}` : pangkatProper);
      const jabatanProper = cleanJabatanForDocument(toProperCase(emp.uraian_jabatan || ''));
      
      addCaseVariations(templateData, `nama pegawai ${num}`, namaProper);
      addCaseVariations(templateData, `pangkat pegawai ${num}`, pangkatLengkap);
      addCaseVariations(templateData, `jabatan pegawai ${num}`, jabatanProper);
    });
    
    // Add conditional flags for template conditionals (to hide unused employee slots)
    templateData.hasEmployee2 = employees.length >= 2;
    templateData.hasEmployee3 = employees.length >= 3;
    templateData.hasEmployee4 = employees.length >= 4;
    templateData.hasEmployee5 = employees.length >= 5;

    // Fill empty values for unused employee slots to prevent errors
    for (let i = employees.length + 1; i <= 5; i++) {
      addCaseVariations(templateData, `nama pegawai ${i}`, '');
      addCaseVariations(templateData, `pangkat pegawai ${i}`, '');
      addCaseVariations(templateData, `jabatan pegawai ${i}`, '');
    }
    
    // For loop-based templates (>5 employees)
    templateData.employees = employeeList;

    console.log("📝 [documentGenerator] Setting template data with", Object.keys(templateData).length, "keys");

    // Render template with data
    try {
      doc.render(templateData);
      console.log("✅ [documentGenerator] Template rendered successfully");
    } catch (error: any) {
      console.error("❌ [documentGenerator] Template rendering error:", error);
      throw new Error(`Template rendering failed: ${error.message}`);
    }

    // Get the generated document as buffer
    const generatedDoc = doc.getZip().generate({
      type: "arraybuffer",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    console.log("✅ [documentGenerator] Document generated (skipping XML post-processing to prevent corruption)")

    // Save the file
    const blob = new Blob([generatedDoc], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    
    const filename = `Surat_Tugas_${data.nomor_surat.replace(/\//g, '_')}.docx`;
    saveAs(blob, filename);
    
    console.log("✅ [documentGenerator] Surat Tugas generated successfully:", filename);
  } catch (error) {
    console.error("❌ [documentGenerator] Error generating Surat Tugas:", error);
    throw error;
  }
};
