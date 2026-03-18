import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

interface PlhPltData {
  id: string;
  agenda_number?: number;
  jenis_plh_plt?: 'PLH' | 'PLT';
  unit_penerbit: string;
  unit_pemohon: string;
  nomor_naskah_dinas: string;
  tanggal: string;
  perihal: string;
  dasar_penugasan?: string;
  tanggal_plh_mulai?: string;
  tanggal_plh_selesai?: string;
  employee_ids?: string[];
  employee_id?: string;
  pejabat_unit_pemohon_id?: string;
  pejabat_unit_penerbit_id?: string;
}

interface EmployeeData {
  id: string;
  nm_pegawai: string;
  nip: string;
  uraian_pangkat: string;
  uraian_jabatan: string;
  nm_unit_organisasi: string;
}

// Format date to Indonesian format
const formatTanggalIndo = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return format(date, "dd MMMM yyyy", { locale: id });
  } catch (error) {
    return dateString;
  }
};

// Format date range
const formatTanggalRange = (startDate?: string, endDate?: string): string => {
  if (!startDate || !endDate) return "-";
  
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const startDay = format(start, "dd", { locale: id });
    const endDay = format(end, "dd", { locale: id });
    const startMonth = format(start, "MMMM", { locale: id });
    const endMonth = format(end, "MMMM", { locale: id });
    const startYear = format(start, "yyyy", { locale: id });
    const endYear = format(end, "yyyy", { locale: id });

    if (startYear !== endYear) {
      return `${startDay} ${startMonth} ${startYear} - ${endDay} ${endMonth} ${endYear}`;
    }
    if (startMonth !== endMonth) {
      return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${endYear}`;
    }
    return `${startDay} - ${endDay} ${endMonth} ${endYear}`;
  } catch (error) {
    return `${startDate} - ${endDate}`;
  }
};

// Convert text to proper case
const toProperCase = (text: string): string => {
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Fetch employee data
const fetchEmployeeData = async (employeeId: string): Promise<EmployeeData | null> => {
  try {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("id", employeeId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching employee data:", error);
    return null;
  }
};

// Load template file
const loadTemplate = async (templatePath: string): Promise<ArrayBuffer> => {
  const response = await fetch(templatePath);
  if (!response.ok) {
    throw new Error(`Failed to load template: ${templatePath}`);
  }
  return await response.arrayBuffer();
};

// Generate document
const generateDocument = async (
  templatePath: string,
  data: any,
  fileName: string
): Promise<void> => {
  try {
    console.log("[PLH/PLT] Starting document generation", { templatePath, fileName, dataKeys: Object.keys(data || {}) });
    const templateData = await loadTemplate(templatePath);
    const zip = new PizZip(templateData);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: '<<', end: '>>' },
      nullGetter: () => ""
    });

    console.log("[PLH/PLT] Rendering with data:", data);
    doc.render(data);

    const blob = doc.getZip().generate({
      type: "blob",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    console.log("[PLH/PLT] Blob generated successfully, size:", blob.size, "bytes");

    // Try using file-saver first
    try {
      saveAs(blob, fileName);
      console.log("[PLH/PLT] saveAs() called successfully");
      
      // Give a small delay to ensure saveAs completes
      await new Promise(resolve => setTimeout(resolve, 100));
      console.log("[PLH/PLT] Document download initiated");
    } catch (saveError) {
      console.error("[PLH/PLT] saveAs() failed, using fallback download:", saveError);
      
      // Fallback: Native browser download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log("[PLH/PLT] Fallback download completed and cleaned up");
      }, 100);
    }
  } catch (error: any) {
    console.error("[PLH/PLT] Error generating document:", error);
    if (error?.properties) {
      console.error("[PLH/PLT] Docxtemplater error properties:", error.properties);
    }
    throw error;
  }
};

// Generate ND PLH
export const generateNDPlh = async (plhData: PlhPltData): Promise<void> => {
  // Validation
  const employeeId = plhData.employee_ids?.[0] || plhData.employee_id;
  console.log("[PLH/PLT] generateNDPlh called", { plhData, resolvedEmployeeId: employeeId });
  if (!employeeId) {
    throw new Error("Belum ada pegawai yang ditunjuk");
  }

  // Fetch employee data
  const employeeData = await fetchEmployeeData(employeeId);
  if (!employeeData) {
    throw new Error("Data pegawai tidak ditemukan");
  }

  // Fetch pejabat penandatangan
  let pejabatPenandatangan = "";
  if (plhData.pejabat_unit_pemohon_id) {
    const pejabatData = await fetchEmployeeData(plhData.pejabat_unit_pemohon_id);
    if (pejabatData) {
      pejabatPenandatangan = toProperCase(pejabatData.nm_pegawai);
    }
  }

  // Prepare template data
  const templateData = {
    "Nomor ND": plhData.nomor_naskah_dinas || "",
    "Unit Penerbit": plhData.unit_penerbit || "",
    "Unit Pemohon": plhData.unit_pemohon || "",
    "Konsideran Naskah Dinas": plhData.dasar_penugasan || "",
    "Dasar Penugasan": plhData.dasar_penugasan || "",
    "Nomor Naskah Dinas": plhData.nomor_naskah_dinas || "",
    "Tanggal Naskah Dinas": formatTanggalIndo(plhData.tanggal),
    "Perihal Naskah Dinas": plhData.perihal || "",
    "Tanggal PLH Mulai – Tanggal PLH Selesai": formatTanggalRange(
      plhData.tanggal_plh_mulai,
      plhData.tanggal_plh_selesai
    ),
    "Nama Lengkap": toProperCase(employeeData.nm_pegawai),
    "NIP Pejabat": employeeData.nip || "",
    "Pangkat/Gol": toProperCase(employeeData.uraian_pangkat),
    "Jabatan Pejabat": toProperCase(employeeData.uraian_jabatan),
    "Pejabat Penandatangan Pemohon": pejabatPenandatangan,
  };

  const fileName = `ND_PLH_Agenda_${plhData.agenda_number}_${employeeData.nm_pegawai.replace(/\s+/g, '_')}.docx`;
  
  await generateDocument("/templates/ND_PLH.docx", templateData, fileName);
};

// Generate ND PLT
export const generateNDPlt = async (plhData: PlhPltData): Promise<void> => {
  // Validation
  const employeeId = plhData.employee_ids?.[0] || plhData.employee_id;
  console.log("[PLH/PLT] generateNDPlt called", { plhData, resolvedEmployeeId: employeeId });
  if (!employeeId) {
    throw new Error("Belum ada pegawai yang ditunjuk");
  }

  // Fetch employee data
  const employeeData = await fetchEmployeeData(employeeId);
  if (!employeeData) {
    throw new Error("Data pegawai tidak ditemukan");
  }

  // Fetch pejabat penandatangan
  let pejabatPenandatangan = "";
  if (plhData.pejabat_unit_pemohon_id) {
    const pejabatData = await fetchEmployeeData(plhData.pejabat_unit_pemohon_id);
    if (pejabatData) {
      pejabatPenandatangan = toProperCase(pejabatData.nm_pegawai);
    }
  }

  // Prepare template data
  const templateData = {
    "Nomor ND": plhData.nomor_naskah_dinas || "",
    "Unit Penerbit": plhData.unit_penerbit || "",
    "Unit Pemohon": plhData.unit_pemohon || "",
    "Konsideran Naskah Dinas": plhData.dasar_penugasan || "",
    "Dasar Penugasan": plhData.dasar_penugasan || "",
    "Nomor Naskah Dinas": plhData.nomor_naskah_dinas || "",
    "Tanggal Naskah Dinas": formatTanggalIndo(plhData.tanggal),
    "Perihal Naskah Dinas": plhData.perihal || "",
    "Tanggal PLT Mulai – Tanggal PLT Selesai": formatTanggalRange(
      plhData.tanggal_plh_mulai,
      plhData.tanggal_plh_selesai
    ),
    "Nama Lengkap": toProperCase(employeeData.nm_pegawai),
    "NIP Pejabat": employeeData.nip || "",
    "Pangkat/Gol": toProperCase(employeeData.uraian_pangkat),
    "Jabatan Pejabat": toProperCase(employeeData.uraian_jabatan),
    "Pejabat Penandatangan Pemohon": pejabatPenandatangan,
  };

  const fileName = `ND_PLT_Agenda_${plhData.agenda_number}_${employeeData.nm_pegawai.replace(/\s+/g, '_')}.docx`;
  
  await generateDocument("/templates/ND_PLT.docx", templateData, fileName);
};

// Generate PRIN PLH
export const generatePRINPlh = async (plhData: PlhPltData): Promise<void> => {
  // Validation
  const employeeId = plhData.employee_ids?.[0] || plhData.employee_id;
  console.log("[PLH/PLT] generatePRINPlh called", { plhData, resolvedEmployeeId: employeeId });
  if (!employeeId) {
    throw new Error("Belum ada pegawai yang ditunjuk");
  }

  // Fetch employee data
  const employeeData = await fetchEmployeeData(employeeId);
  if (!employeeData) {
    throw new Error("Data pegawai tidak ditemukan");
  }

  // Fetch pejabat penandatangan penerbit
  let pejabatPenandatangan = "";
  if (plhData.pejabat_unit_penerbit_id) {
    const pejabatData = await fetchEmployeeData(plhData.pejabat_unit_penerbit_id);
    if (pejabatData) {
      pejabatPenandatangan = toProperCase(pejabatData.nm_pegawai);
    }
  }

  // Prepare template data
  const templateData = {
    "Nomor PRIN": plhData.nomor_naskah_dinas || "",
    "Tanggal PRIN": formatTanggalIndo(new Date().toISOString()),
    "Unit Pemohon": plhData.unit_pemohon || "",
    "Konsideran Naskah Dinas": plhData.dasar_penugasan || "",
    "Dasar Penugasan": plhData.dasar_penugasan || "",
    "Nomor Naskah Dinas": plhData.nomor_naskah_dinas || "",
    "Tanggal Naskah Dinas": formatTanggalIndo(plhData.tanggal),
    "Perihal": plhData.perihal || "",
    "Nama Lengkap Pejabat Plh": toProperCase(employeeData.nm_pegawai),
    "NIP Plh": employeeData.nip || "",
    "Pangkat/Gol Plh": employeeData.uraian_pangkat.toUpperCase(),
    "Jabatan Plh": toProperCase(employeeData.uraian_jabatan),
    "Tanggal Plh Mulai – Tanggal Plh Selesai": formatTanggalRange(
      plhData.tanggal_plh_mulai,
      plhData.tanggal_plh_selesai
    ),
    "Pejabat Penandatangan Penerbit": pejabatPenandatangan,
  };

  const fileName = `PRIN_PLH_Agenda_${plhData.agenda_number}_${employeeData.nm_pegawai.replace(/\s+/g, '_')}.docx`;
  
  await generateDocument("/templates/Prin_PLH.docx", templateData, fileName);
};

// Generate PRIN PLT
export const generatePRINPlt = async (plhData: PlhPltData): Promise<void> => {
  // Validation
  const employeeId = plhData.employee_ids?.[0] || plhData.employee_id;
  console.log("[PLH/PLT] generatePRINPlt called", { plhData, resolvedEmployeeId: employeeId });
  if (!employeeId) {
    throw new Error("Belum ada pegawai yang ditunjuk");
  }

  // Fetch employee data
  const employeeData = await fetchEmployeeData(employeeId);
  if (!employeeData) {
    throw new Error("Data pegawai tidak ditemukan");
  }

  // Fetch pejabat penandatangan penerbit
  let pejabatPenandatangan = "";
  if (plhData.pejabat_unit_penerbit_id) {
    const pejabatData = await fetchEmployeeData(plhData.pejabat_unit_penerbit_id);
    if (pejabatData) {
      pejabatPenandatangan = toProperCase(pejabatData.nm_pegawai);
    }
  }

  // Prepare template data
  const templateData = {
    "Nomor PRIN": plhData.nomor_naskah_dinas || "",
    "Tanggal PRIN": formatTanggalIndo(new Date().toISOString()),
    "Unit Pemohon": plhData.unit_pemohon || "",
    "Konsideran Naskah Dinas": plhData.dasar_penugasan || "",
    "Nomor Konsideran": plhData.nomor_naskah_dinas || "",
    "Tanggal Konsideran": formatTanggalIndo(plhData.tanggal),
    "Perihal": plhData.perihal || "",
    "Nama Lengkap Pejabat Plt": toProperCase(employeeData.nm_pegawai),
    "NIP Plt": employeeData.nip || "",
    "Pangkat/Gol Plt": employeeData.uraian_pangkat.toUpperCase(),
    "Jabatan Plt": toProperCase(employeeData.uraian_jabatan),
    "Tanggal Plt Mulai – Tanggal Plt Selesai": formatTanggalRange(
      plhData.tanggal_plh_mulai,
      plhData.tanggal_plh_selesai
    ),
    "Pejabat Penandatangan Penerbit": pejabatPenandatangan,
  };

  const fileName = `PRIN_PLT_Agenda_${plhData.agenda_number}_${employeeData.nm_pegawai.replace(/\s+/g, '_')}.docx`;
  
  await generateDocument("/templates/Prin_PLT.docx", templateData, fileName);
};
