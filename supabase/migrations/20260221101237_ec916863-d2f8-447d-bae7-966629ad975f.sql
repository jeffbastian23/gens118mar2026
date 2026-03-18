
-- RPC: Age distribution stats from corebase_db_pokok
CREATE OR REPLACE FUNCTION public.get_corebase_age_stats()
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(row_to_json(t)) INTO result FROM (
    SELECT range_label, count FROM (
      SELECT 
        CASE 
          WHEN age < 25 THEN '< 25 tahun'
          WHEN age BETWEEN 25 AND 30 THEN '25-30 tahun'
          WHEN age BETWEEN 31 AND 35 THEN '31-35 tahun'
          WHEN age BETWEEN 36 AND 40 THEN '36-40 tahun'
          WHEN age BETWEEN 41 AND 45 THEN '41-45 tahun'
          WHEN age BETWEEN 46 AND 50 THEN '46-50 tahun'
          WHEN age BETWEEN 51 AND 55 THEN '51-55 tahun'
          ELSE '> 55 tahun'
        END AS range_label,
        COUNT(*)::int AS count
      FROM (
        SELECT EXTRACT(YEAR FROM AGE(CURRENT_DATE, tgl_lahir::date))::int AS age
        FROM corebase_db_pokok
        WHERE tgl_lahir IS NOT NULL
      ) ages
      GROUP BY range_label
    ) grouped
    WHERE count > 0
    ORDER BY 
      CASE range_label
        WHEN '< 25 tahun' THEN 1
        WHEN '25-30 tahun' THEN 2
        WHEN '31-35 tahun' THEN 3
        WHEN '36-40 tahun' THEN 4
        WHEN '41-45 tahun' THEN 5
        WHEN '46-50 tahun' THEN 6
        WHEN '51-55 tahun' THEN 7
        WHEN '> 55 tahun' THEN 8
      END
  ) t;
  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- RPC: Gender stats
CREATE OR REPLACE FUNCTION public.get_corebase_gender_stats()
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(row_to_json(t)) INTO result FROM (
    SELECT COALESCE(gender, 'Tidak diketahui') AS label, COUNT(*)::int AS count
    FROM corebase_db_pokok
    GROUP BY gender
    ORDER BY count DESC
  ) t;
  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- RPC: Religion stats
CREATE OR REPLACE FUNCTION public.get_corebase_religion_stats()
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(row_to_json(t)) INTO result FROM (
    SELECT COALESCE(agama, 'Tidak diketahui') AS label, COUNT(*)::int AS count
    FROM corebase_db_pokok
    GROUP BY agama
    ORDER BY count DESC
  ) t;
  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- RPC: Status stats (CLTN, Pemberhentian, Meninggal)
CREATE OR REPLACE FUNCTION public.get_corebase_status_stats()
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'cltn_active', (SELECT COUNT(*)::int FROM corebase_db_status WHERE flag_cltn = true),
    'cltn_inactive', (SELECT COUNT(*)::int FROM corebase_db_status WHERE flag_cltn IS NULL OR flag_cltn = false),
    'meninggal', (SELECT COUNT(*)::int FROM corebase_db_status WHERE flag_meninggal = true),
    'pemberhentian_total', (SELECT COUNT(*)::int FROM corebase_db_status WHERE flag_pemberhentian = true),
    'pemberhentian_by_jenis', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (
        SELECT COALESCE(pemberhentian_jenis, 'Tidak diketahui') AS label, COUNT(*)::int AS count
        FROM corebase_db_status
        WHERE flag_pemberhentian = true
        GROUP BY pemberhentian_jenis
        ORDER BY count DESC
      ) t
    )
  ) INTO result;
  RETURN result;
END;
$$;

-- RPC: Pensiun stats (BUP & TMT)
CREATE OR REPLACE FUNCTION public.get_corebase_pensiun_stats()
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSON;
  current_yr int;
BEGIN
  current_yr := EXTRACT(YEAR FROM CURRENT_DATE)::int;
  SELECT json_build_object(
    'bup', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (
        SELECT COALESCE(bup::text || ' tahun', 'Tidak diketahui') AS label, COUNT(*)::int AS count
        FROM corebase_db_pensiun
        GROUP BY bup
        ORDER BY count DESC
      ) t
    ),
    'tmt_pensiun', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (
        SELECT label, SUM(cnt)::int AS count FROM (
          SELECT 
            CASE 
              WHEN tmt_pensiun IS NULL THEN 'Tidak diketahui'
              WHEN EXTRACT(YEAR FROM tmt_pensiun::date) <= current_yr THEN '≤ ' || current_yr
              ELSE EXTRACT(YEAR FROM tmt_pensiun::date)::text
            END AS label,
            1 AS cnt
          FROM corebase_db_pensiun
        ) sub
        GROUP BY label
        ORDER BY label
      ) t
    )
  ) INTO result;
  RETURN result;
END;
$$;

-- RPC: Goljab stats (satker, unit, jabatan counts only)
CREATE OR REPLACE FUNCTION public.get_corebase_goljab_stats()
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'satker', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (
        SELECT COALESCE(satuan_kerja, 'Tidak diketahui') AS label, COUNT(*)::int AS count
        FROM corebase_db_goljab
        GROUP BY satuan_kerja
        ORDER BY count DESC
      ) t
    ),
    'unit', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (
        SELECT COALESCE(unit, 'Tidak diketahui') AS label, COUNT(*)::int AS count
        FROM corebase_db_goljab
        GROUP BY unit
        ORDER BY count DESC
      ) t
    ),
    'jabatan', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (
        SELECT COALESCE(jabatan, 'Tidak diketahui') AS label, COUNT(*)::int AS count
        FROM corebase_db_goljab
        GROUP BY jabatan
        ORDER BY count DESC
      ) t
    )
  ) INTO result;
  RETURN result;
END;
$$;
