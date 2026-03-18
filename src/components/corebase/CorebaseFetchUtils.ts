import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type TableName = keyof Database["public"]["Tables"];

/**
 * Fetch all rows from a Supabase table, bypassing the 1000 row limit.
 * Uses pagination with range queries.
 */
export async function fetchAllRows<T>(
  tableName: TableName,
  orderBy: string = "nama",
  ascending: boolean = true,
  columns: string = "*"
): Promise<T[]> {
  const PAGE_SIZE = 1000;
  let allData: T[] = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await (supabase.from(tableName) as any)
      .select(columns)
      .order(orderBy, { ascending })
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;

    if (data && data.length > 0) {
      allData = [...allData, ...(data as T[])];
      from += PAGE_SIZE;
      hasMore = data.length === PAGE_SIZE;
    } else {
      hasMore = false;
    }
  }

  return allData;
}

/**
 * Clean nama: strip text after comma (e.g., "Nizar Fauzi, S.M." → "Nizar Fauzi")
 */
export function cleanNama(nama: string): string {
  if (!nama) return nama;
  const commaIndex = nama.indexOf(",");
  if (commaIndex > 0) {
    return nama.substring(0, commaIndex).trim();
  }
  return nama;
}

/**
 * Clean NIP: remove leading apostrophe
 */
export function cleanNip(nip: string): string {
  if (!nip) return nip;
  return nip.replace(/^'/, "").trim();
}

/**
 * Calculate TMT CPNS from NIP digits 9-14 (YYYYMM → date string YYYY-MM-01)
 */
export function calculateTmtCpnsFromNip(nip: string): string | null {
  const cleanedNip = cleanNip(nip);
  if (cleanedNip.length < 14) return null;
  const yearStr = cleanedNip.substring(8, 12);
  const monthStr = cleanedNip.substring(12, 14);
  const year = parseInt(yearStr);
  const month = parseInt(monthStr);
  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) return null;
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

/**
 * Calculate TMT PNS = TMT CPNS + 1 year
 */
export function calculateTmtPnsFromNip(nip: string): string | null {
  const tmtCpns = calculateTmtCpnsFromNip(nip);
  if (!tmtCpns) return null;
  const date = new Date(tmtCpns);
  date.setFullYear(date.getFullYear() + 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

/**
 * Determine gender from NIP digit 15 (1=Pria, 2=Wanita)
 */
export function determineGenderFromNip(nip: string): string {
  const cleanedNip = cleanNip(nip);
  if (cleanedNip.length >= 15) {
    const digit = parseInt(cleanedNip.charAt(14));
    if (digit === 1) return "Pria";
    if (digit === 2) return "Wanita";
  }
  return "";
}
