// Utility functions for Grading Jabatan Baru logic

export interface JabatanOption {
  jabatan: string;
  syarat_golongan: string;
  syarat_pendidikan: string;
}

// Golongan ranking for comparison
const GOL_RANKING: Record<string, number> = {
  "II/A": 1, "II/B": 2, "II/C": 3, "II/D": 4,
  "III/A": 5, "III/B": 6, "III/C": 7, "III/D": 8,
  "IV/A": 9, "IV/B": 10, "IV/C": 11, "IV/D": 12, "IV/E": 13
};

// Education level ranking for comparison  
const PENDIDIKAN_RANKING: Record<string, number> = {
  "SLTA": 1, "SMA": 1, "SMK": 1,
  "D1": 2,
  "D2": 3,
  "D3": 4,
  "D4": 5, "S1": 5,
  "S2": 6,
  "S3": 7
};

// Get golongan ranking (case insensitive)
export const getGolonganRank = (gol: string): number => {
  if (!gol) return 0;
  const normalized = gol.toUpperCase().replace(/\s/g, "");
  return GOL_RANKING[normalized] || 0;
};

// Get pendidikan ranking (case insensitive)
export const getPendidikanRank = (pend: string): number => {
  if (!pend) return 0;
  const normalized = pend.toUpperCase().replace(/\s/g, "").trim();
  
  // Check for S1, D4 variants
  if (normalized.includes("S3") || normalized.includes("SIII")) return 7;
  if (normalized.includes("S2") || normalized.includes("SII")) return 6;
  if (normalized.includes("S1") || normalized.includes("SI") || normalized.includes("D4") || normalized.includes("DIV")) return 5;
  if (normalized.includes("D3") || normalized.includes("DIII")) return 4;
  if (normalized.includes("D2") || normalized.includes("DII")) return 3;
  if (normalized.includes("D1") || normalized.includes("DI")) return 2;
  if (normalized.includes("SLTA") || normalized.includes("SMA") || normalized.includes("SMK")) return 1;
  
  return 0;
};

// Check if golongan meets syarat requirement (pegawai's gol >= syarat gol)
export const meetsGolonganSyarat = (pegawaiGol: string, syaratGol: string): boolean => {
  if (!syaratGol) return true;
  const pegawaiRank = getGolonganRank(pegawaiGol);
  const syaratRank = getGolonganRank(syaratGol);
  return pegawaiRank >= syaratRank;
};

// Check if pendidikan meets syarat requirement
export const meetsPendidikanSyarat = (pegawaiPend: string, syaratPend: string): boolean => {
  if (!syaratPend) return true;
  const pegawaiRank = getPendidikanRank(pegawaiPend);
  
  // Handle multiple syarat like "S1, D4"
  const syaratParts = syaratPend.split(",").map(s => s.trim());
  const minSyaratRank = Math.min(...syaratParts.map(s => getPendidikanRank(s)));
  
  return pegawaiRank >= minSyaratRank;
};

/**
 * Get available jabatan options for PU klaster based on grade, 
 * filtered by pegawai's golongan and pendidikan
 */
export const getAvailableJabatanOptionsForPU = (
  gradeBaru: number,
  pegawaiGolongan: string,
  pegawaiPendidikan: string,
  daftarGradeData: Array<{
    klaster: string;
    grade: number;
    jabatan: string;
    syarat_golongan: string | null;
    syarat_pendidikan: string | null;
  }>
): JabatanOption[] => {
  // Filter daftar_grade by PU klaster and matching grade
  const matchingGrades = daftarGradeData.filter(dg => 
    dg.klaster === "PU" && dg.grade === gradeBaru
  );
  
  // Filter by golongan and pendidikan requirements
  const availableOptions: JabatanOption[] = [];
  
  for (const dg of matchingGrades) {
    const meetsGol = meetsGolonganSyarat(pegawaiGolongan, dg.syarat_golongan || "");
    const meetsPend = meetsPendidikanSyarat(pegawaiPendidikan, dg.syarat_pendidikan || "");
    
    if (meetsGol && meetsPend) {
      availableOptions.push({
        jabatan: dg.jabatan,
        syarat_golongan: dg.syarat_golongan || "",
        syarat_pendidikan: dg.syarat_pendidikan || ""
      });
    }
  }
  
  return availableOptions;
};

/**
 * Determine the best jabatan for PU based on pendidikan (primary) and golongan (secondary)
 * Returns the recommended klaster/jabatan family:
 * - Penata Layanan Operasional: D4/S1+ AND III/a+
 * - Pengolah Data dan Informasi: D3 AND II/c+
 * - Pengadministrasi Perkantoran: SMA/D1 AND II/a+
 */
export const determineJabatanFamily = (
  pegawaiGolongan: string,
  pegawaiPendidikan: string
): { family: string; eligible: boolean; reason: string } => {
  const golRank = getGolonganRank(pegawaiGolongan);
  const pendRank = getPendidikanRank(pegawaiPendidikan);
  
  // Penata Layanan Operasional: requires D4/S1 (rank 5+) AND III/a (rank 5+)
  if (pendRank >= 5 && golRank >= 5) {
    return { 
      family: "Penata Layanan Operasional", 
      eligible: true, 
      reason: "Memenuhi syarat D4/S1 dan III/a" 
    };
  }
  
  // Has S1/D4 education but golongan not enough for PLO
  if (pendRank >= 5 && golRank < 5) {
    return { 
      family: "Penata Layanan Operasional", 
      eligible: false, 
      reason: `Pendidikan ${pegawaiPendidikan} memenuhi, tapi golongan ${pegawaiGolongan} belum memenuhi syarat (min. III/a)` 
    };
  }
  
  // Pengolah Data dan Informasi: requires D3 (rank 4) AND II/c (rank 3+)
  if (pendRank >= 4 && golRank >= 3) {
    return { 
      family: "Pengolah Data dan Informasi", 
      eligible: true, 
      reason: "Memenuhi syarat D3 dan II/c" 
    };
  }
  
  // Has D3 education but golongan not enough
  if (pendRank >= 4 && golRank < 3) {
    return { 
      family: "Pengolah Data dan Informasi", 
      eligible: false, 
      reason: `Pendidikan ${pegawaiPendidikan} memenuhi, tapi golongan ${pegawaiGolongan} belum memenuhi syarat (min. II/c)` 
    };
  }
  
  // Pengadministrasi Perkantoran: SMA/D1 (rank 1-2) AND II/a (rank 1+)
  if (pendRank >= 1 && golRank >= 1) {
    return { 
      family: "Pengadministrasi Perkantoran", 
      eligible: true, 
      reason: "Memenuhi syarat SLTA/D1 dan II/a" 
    };
  }
  
  return { 
    family: "-", 
    eligible: false, 
    reason: "Tidak dapat menentukan jabatan" 
  };
};

/**
 * Enhanced analyzeJabatanBaru that considers both pendidikan AND golongan
 */
export const analyzeJabatanBaruWithGolongan = (
  pegawaiPendidikan: string | null,
  pegawaiGolongan: string | null
): { jabatan: string; color: string; eligible: boolean; reason: string } => {
  if (!pegawaiPendidikan || !pegawaiGolongan) {
    return { jabatan: "-", color: "", eligible: false, reason: "Data tidak lengkap" };
  }
  
  const result = determineJabatanFamily(pegawaiGolongan, pegawaiPendidikan);
  
  if (result.eligible) {
    const colorMap: Record<string, string> = {
      "Penata Layanan Operasional": "bg-green-100 text-green-800",
      "Pengolah Data dan Informasi": "bg-purple-100 text-purple-800",
      "Pengadministrasi Perkantoran": "bg-blue-100 text-blue-800",
    };
    
    return {
      jabatan: result.family,
      color: colorMap[result.family] || "",
      eligible: true,
      reason: result.reason
    };
  }
  
  return {
    jabatan: result.family,
    color: "bg-red-100 text-red-800",
    eligible: false,
    reason: result.reason
  };
};

/**
 * Get jabatan with Tingkat suffix based on grade for a given jabatan family
 */
export const getJabatanWithTingkat = (family: string, grade: number): string => {
  // Map grade to Tingkat based on jabatan family
  const tingkatMap: Record<string, Record<number, string>> = {
    "Penata Layanan Operasional": {
      12: "Tk.I",
      11: "Tk.II",
      10: "Tk.III",
      9: "Tk.IV",
      8: "Tk.V"
    },
    "Pengolah Data dan Informasi": {
      10: "Tk.I",
      9: "Tk.II",
      8: "Tk.III",
      7: "Tk.IV",
      6: "Tk.V"
    },
    "Pengadministrasi Perkantoran": {
      8: "Tk.I",
      7: "Tk.II",
      6: "Tk.III",
      5: "Tk.IV",
      4: "Tk.V"
    }
  };
  
  const familyTingkat = tingkatMap[family];
  if (!familyTingkat || !familyTingkat[grade]) {
    return family;
  }
  
  return `${family} ${familyTingkat[grade]}`;
};

/**
 * Get all possible jabatan options for a grade from daftar_grade for PU
 */
export const getAllPUJabatanOptionsForGrade = (
  grade: number,
  daftarGradeData: Array<{
    klaster: string;
    grade: number;
    jabatan: string;
    syarat_golongan: string | null;
    syarat_pendidikan: string | null;
  }>
): JabatanOption[] => {
  return daftarGradeData
    .filter(dg => dg.klaster === "PU" && dg.grade === grade)
    .map(dg => ({
      jabatan: dg.jabatan,
      syarat_golongan: dg.syarat_golongan || "",
      syarat_pendidikan: dg.syarat_pendidikan || ""
    }));
};

/**
 * Get single jabatan for PTB based on grade
 */
export const getPTBJabatan = (
  grade: number,
  daftarGradeData: Array<{
    klaster: string;
    grade: number;
    jabatan: string;
  }>
): string => {
  const match = daftarGradeData.find(dg => dg.klaster === "PTB" && dg.grade === grade);
  return match?.jabatan || "";
};

/**
 * Get single jabatan for PK based on grade
 */
export const getPKJabatan = (
  grade: number,
  daftarGradeData: Array<{
    klaster: string;
    grade: number;
    jabatan: string;
  }>
): string => {
  const match = daftarGradeData.find(dg => dg.klaster === "PK" && dg.grade === grade);
  return match?.jabatan || "";
};
