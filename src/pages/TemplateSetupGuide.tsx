import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { FileText, AlertCircle, CheckCircle2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const TemplateSetupGuide = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Panduan Setup Template Dokumen</h1>
          <p className="text-muted-foreground">
            Panduan lengkap untuk memperbaiki template Word agar compatible dengan sistem generator
          </p>
        </div>
        <Button onClick={() => navigate("/generate-template")} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Generate Template
        </Button>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Template Word harus diedit secara manual di Microsoft Word atau LibreOffice untuk menambahkan
          syntax conditional dan loop yang benar. Library programmatic tidak dapat membuat struktur XML
          yang kompatibel dengan docxtemplater.
        </AlertDescription>
      </Alert>

      {/* Overview Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Ikhtisar Masalah & Solusi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Masalah yang Ditemukan:</h3>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>
                <strong>Template ≤5 Pegawai:</strong> Baris kosong muncul untuk slot pegawai yang tidak digunakan
                (contoh: hanya 1 pegawai ditugaskan, tapi baris 2-5 tetap muncul kosong)
              </li>
              <li>
                <strong>Template &gt;5 Pegawai:</strong> Semua pegawai masuk ke satu baris tabel, tidak membuat baris
                terpisah per pegawai
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Solusi:</h3>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>
                <strong>Template ≤5 Pegawai:</strong> Gunakan conditional sections <code className="bg-muted px-1 rounded">
                  &#123;#hasEmployee2&#125;...&#123;/hasEmployee2&#125;
                </code> untuk menyembunyikan slot kosong
              </li>
              <li>
                <strong>Template &gt;5 Pegawai:</strong> Gunakan row-level loop syntax <code className="bg-muted px-1 rounded">
                  &#123;#employees&#125;...&#123;/employees&#125;
                </code> yang wrap entire table row
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Small Group Template Guide */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Badge variant="outline" className="mr-2">1</Badge>
            Template ≤5 Pegawai - Tambahkan Conditional Sections
          </CardTitle>
          <CardDescription>
            Files: <code>ST_Kegiatan_kurang_dari_sama_dengan_5_pegawai.docx</code> dan{" "}
            <code>ND_Kegiatan_kurang_dari_sama_dengan_5_pegawai.docx</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Langkah-Langkah Setup:
            </h3>
            <ol className="list-decimal list-inside space-y-3 text-sm">
              <li>
                <strong>Buka template di Microsoft Word atau LibreOffice</strong>
                <br />
                <span className="text-muted-foreground ml-6">
                  File location: <code className="bg-muted px-1 rounded">public/templates/</code>
                </span>
              </li>

              <li>
                <strong>Cari section untuk Pegawai 1 (biasanya setelah "Menugaskan:")</strong>
                <br />
                <span className="text-muted-foreground ml-6">
                  Format saat ini:
                </span>
                <pre className="bg-muted p-3 rounded mt-2 ml-6 text-xs overflow-x-auto">
{`1. nama     : <<Nama Pegawai 1>>
   pangkat  : <<Pangkat Pegawai 1>>
   jabatan  : <<Jabatan Pegawai 1>>`}
                </pre>
              </li>

              <li>
                <strong>Wrap Pegawai 2-5 dengan conditional sections</strong>
                <br />
                <span className="text-muted-foreground ml-6">
                  Tambahkan baris sebelum dan sesudah setiap block pegawai:
                </span>
                <pre className="bg-muted p-3 rounded mt-2 ml-6 text-xs overflow-x-auto">
{`{#hasEmployee2}
2. nama     : <<Nama Pegawai 2>>
   pangkat  : <<Pangkat Pegawai 2>>
   jabatan  : <<Jabatan Pegawai 2>>
{/hasEmployee2}

{#hasEmployee3}
3. nama     : <<Nama Pegawai 3>>
   pangkat  : <<Pangkat Pegawai 3>>
   jabatan  : <<Jabatan Pegawai 3>>
{/hasEmployee3}

{#hasEmployee4}
4. nama     : <<Nama Pegawai 4>>
   pangkat  : <<Pangkat Pegawai 4>>
   jabatan  : <<Jabatan Pegawai 4>>
{/hasEmployee4}

{#hasEmployee5}
5. nama     : <<Nama Pegawai 5>>
   pangkat  : <<Pangkat Pegawai 5>>
   jabatan  : <<Jabatan Pegawai 5>>
{/hasEmployee5}`}
                </pre>
              </li>

              <li>
                <strong>Pastikan tidak ada spasi atau karakter tersembunyi</strong>
                <br />
                <span className="text-muted-foreground ml-6">
                  Syntax harus persis <code className="bg-muted px-1 rounded">&#123;#hasEmployee2&#125;</code> dan{" "}
                  <code className="bg-muted px-1 rounded">&#123;/hasEmployee2&#125;</code>
                </span>
              </li>

              <li>
                <strong>Save template dan test generate dokumen</strong>
              </li>
            </ol>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Penting:</strong> Pegawai 1 TIDAK perlu conditional karena minimal 1 pegawai selalu ada.
              Hanya Pegawai 2-5 yang perlu dibungkus dengan conditional sections.
            </AlertDescription>
          </Alert>

          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Cara Kerja Conditional:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Sistem sekarang mengirim flag <code className="bg-background px-1 rounded">hasEmployee2 = true/false</code></li>
              <li>Jika <code className="bg-background px-1 rounded">hasEmployee2 = false</code>, semua konten di dalam{" "}
                <code className="bg-background px-1 rounded">&#123;#hasEmployee2&#125;...&#123;/hasEmployee2&#125;</code> akan dihapus
              </li>
              <li>Dengan begitu, hanya pegawai yang benar-benar ditugaskan yang muncul di dokumen</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Large Group Template Guide */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Badge variant="outline" className="mr-2">2</Badge>
            Template &gt;5 Pegawai - Fix Table Loop Syntax
          </CardTitle>
          <CardDescription>
            Files: <code>ST_Kegiatan_lebih_dari_5_pegawai.docx</code> dan{" "}
            <code>ND_Kegiatan_lebih_dari_5_pegawai.docx</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Langkah-Langkah Setup:
            </h3>
            <ol className="list-decimal list-inside space-y-3 text-sm">
              <li>
                <strong>Buka template di Microsoft Word atau LibreOffice</strong>
              </li>

              <li>
                <strong>Cari tabel daftar pegawai</strong>
                <br />
                <span className="text-muted-foreground ml-6">
                  Biasanya tabel dengan header: No | Nama | Pangkat/Gol. Ruang | Jabatan
                </span>
              </li>

              <li>
                <strong>Struktur tabel saat ini (SALAH):</strong>
                <br />
                <span className="text-muted-foreground ml-6">
                  Loop syntax terfragmentasi di multiple cells:
                </span>
                <div className="ml-6 mt-2 overflow-x-auto">
                  <table className="min-w-full border-collapse border border-border text-xs">
                    <thead>
                      <tr className="bg-muted">
                        <th className="border border-border px-2 py-1">No</th>
                        <th className="border border-border px-2 py-1">Nama</th>
                        <th className="border border-border px-2 py-1">Pangkat</th>
                        <th className="border border-border px-2 py-1">Jabatan</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-border px-2 py-1 bg-red-50">&#123;#employees&#125;&#123;index&#125;</td>
                        <td className="border border-border px-2 py-1 bg-red-50">&#123;nama&#125;</td>
                        <td className="border border-border px-2 py-1 bg-red-50">&#123;pangkat&#125;</td>
                        <td className="border border-border px-2 py-1 bg-red-50">&#123;jabatan&#125;&#123;/employees&#125;</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <span className="text-red-600 ml-6 mt-2 block">❌ Ini salah - semua data masuk ke satu baris</span>
              </li>

              <li>
                <strong>Delete baris data lama dan buat struktur baru (BENAR):</strong>
                <br />
                <span className="text-muted-foreground ml-6 mt-2 block mb-2">
                  Loop harus wrap entire table row. Caranya:
                </span>
                <ol className="list-[lower-alpha] list-inside ml-6 space-y-2">
                  <li>
                    Posisikan cursor di awal baris data (sebelum cell pertama)
                  </li>
                  <li>
                    Ketik: <code className="bg-muted px-1 rounded">&#123;#employees&#125;</code> lalu tekan Enter
                  </li>
                  <li>
                    Di baris baru, buat tabel row dengan 4 cells:
                    <div className="ml-6 mt-2 overflow-x-auto">
                      <table className="min-w-full border-collapse border border-border text-xs">
                        <tbody>
                          <tr>
                            <td className="border border-border px-2 py-1 bg-green-50">&#123;index&#125;</td>
                            <td className="border border-border px-2 py-1 bg-green-50">&#123;nama&#125;</td>
                            <td className="border border-border px-2 py-1 bg-green-50">&#123;pangkat&#125;</td>
                            <td className="border border-border px-2 py-1 bg-green-50">&#123;jabatan&#125;</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </li>
                  <li>
                    Posisikan cursor di akhir baris data (setelah cell terakhir)
                  </li>
                  <li>
                    Tekan Enter, lalu ketik: <code className="bg-muted px-1 rounded">&#123;/employees&#125;</code>
                  </li>
                </ol>
              </li>

              <li>
                <strong>Hasil akhir struktur yang benar:</strong>
                <pre className="bg-muted p-3 rounded mt-2 ml-6 text-xs overflow-x-auto">
{`[Table Header]
| No | Nama | Pangkat/Gol. Ruang | Jabatan |

{#employees}
[Table Row]
| {index} | {nama} | {pangkat} | {jabatan} |
{/employees}`}
                </pre>
                <span className="text-green-600 ml-6 mt-2 block">✅ Ini benar - setiap pegawai akan dapat baris sendiri</span>
              </li>

              <li>
                <strong>Save template dan test generate dengan banyak pegawai (&gt;15)</strong>
              </li>
            </ol>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Catatan Penting:</strong> Docxtemplater memerlukan loop syntax yang wrap entire table row di level XML.
              Syntax harus ditulis SEBELUM dan SESUDAH row, bukan di dalam cell. Jika ditulis di dalam cell, semua data
              akan masuk ke satu baris.
            </AlertDescription>
          </Alert>

          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Tips Debugging:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>
                Jika masih terjadi error "Word experienced an error trying to open", struktur XML kemungkinan rusak
              </li>
              <li>
                Coba generate ulang template dari <code className="bg-background px-1 rounded">/generate-template</code> page
              </li>
              <li>
                Pastikan tidak ada formatting complex (merged cells, nested tables) di area loop
              </li>
              <li>
                Test dengan data kecil dulu (6-7 pegawai) sebelum test dengan data besar (15+ pegawai)
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Testing Guide */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Badge variant="outline" className="mr-2">3</Badge>
            Testing & Validasi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-3">Checklist Testing:</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-1" />
                <div>
                  <strong className="text-sm">Test Template ≤5 Pegawai:</strong>
                  <ul className="list-disc list-inside ml-4 text-sm text-muted-foreground mt-1">
                    <li>Generate dengan 1 pegawai - hanya 1 yang muncul</li>
                    <li>Generate dengan 3 pegawai - hanya 3 yang muncul</li>
                    <li>Generate dengan 5 pegawai - semua 5 muncul</li>
                    <li>Tidak ada baris kosong untuk slot yang tidak digunakan</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-1" />
                <div>
                  <strong className="text-sm">Test Template &gt;5 Pegawai:</strong>
                  <ul className="list-disc list-inside ml-4 text-sm text-muted-foreground mt-1">
                    <li>Generate dengan 6 pegawai - 6 baris terpisah di tabel</li>
                    <li>Generate dengan 15 pegawai - 15 baris terpisah di tabel</li>
                    <li>Generate dengan 20+ pegawai - semua dapat baris sendiri</li>
                    <li>File bisa dibuka di Microsoft Word tanpa error</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-1" />
                <div>
                  <strong className="text-sm">Validasi Format:</strong>
                  <ul className="list-disc list-inside ml-4 text-sm text-muted-foreground mt-1">
                    <li>Font, spacing, dan layout sesuai template resmi</li>
                    <li>Header dan footer correct</li>
                    <li>Page breaks di tempat yang tepat</li>
                    <li>Tandatangan dan cap tempat tidak bergeser</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      <Card>
        <CardHeader>
          <CardTitle>Troubleshooting Common Issues</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <strong className="text-red-600">Error: "Word experienced an error trying to open the file"</strong>
              <ul className="list-disc list-inside ml-4 text-muted-foreground mt-1 space-y-1">
                <li>XML structure rusak - regenerate template dari awal</li>
                <li>Loop syntax tidak complete - pastikan ada <code className="bg-muted px-1 rounded">&#123;#...&#125;</code> dan{" "}
                  <code className="bg-muted px-1 rounded">&#123;/...&#125;</code>
                </li>
                <li>Formatting terlalu complex - simplify template</li>
              </ul>
            </div>

            <div>
              <strong className="text-red-600">Semua pegawai masih masuk ke satu baris</strong>
              <ul className="list-disc list-inside ml-4 text-muted-foreground mt-1 space-y-1">
                <li>Loop syntax ada di dalam cell, bukan wrap entire row</li>
                <li>Pindahkan <code className="bg-muted px-1 rounded">&#123;#employees&#125;</code> ke baris SEBELUM table row</li>
                <li>Pindahkan <code className="bg-muted px-1 rounded">&#123;/employees&#125;</code> ke baris SESUDAH table row</li>
              </ul>
            </div>

            <div>
              <strong className="text-red-600">Baris kosong masih muncul untuk pegawai yang tidak ada</strong>
              <ul className="list-disc list-inside ml-4 text-muted-foreground mt-1 space-y-1">
                <li>Conditional section tidak ditambahkan - wrap dengan{" "}
                  <code className="bg-muted px-1 rounded">&#123;#hasEmployee2&#125;...&#123;/hasEmployee2&#125;</code>
                </li>
                <li>Typo di conditional flag - harus persis <code className="bg-muted px-1 rounded">hasEmployee2</code> tanpa spasi</li>
                <li>Conditional tidak wrap entire block pegawai - pastikan wrap dari nomor sampai jabatan</li>
              </ul>
            </div>

            <div>
              <strong className="text-red-600">Placeholder tidak terganti (masih muncul &#123;&#123;nama&#125;&#125;)</strong>
              <ul className="list-disc list-inside ml-4 text-muted-foreground mt-1 space-y-1">
                <li>Syntax placeholder salah - gunakan <code className="bg-muted px-1 rounded">&lt;&lt;Nama&gt;&gt;</code> untuk single values</li>
                <li>Gunakan <code className="bg-muted px-1 rounded">&#123;nama&#125;</code> untuk values di dalam loop</li>
                <li>Case sensitive - pastikan nama field sesuai (e.g., <code className="bg-muted px-1 rounded">nama</code> bukan{" "}
                  <code className="bg-muted px-1 rounded">Nama</code> di dalam loop)
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Ringkasan Setup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>
              Generate template dari{" "}
              <Button
                variant="link"
                className="h-auto p-0 text-primary"
                onClick={() => navigate("/generate-template")}
              >
                /generate-template
              </Button>{" "}
              page
            </li>
            <li>Download template Word files</li>
            <li>Buka di Microsoft Word atau LibreOffice</li>
            <li>
              <strong>Untuk template ≤5 pegawai:</strong> Tambahkan conditional sections <code className="bg-muted px-1 rounded">
                &#123;#hasEmployee2&#125;...&#123;/hasEmployee5&#125;
              </code>
            </li>
            <li>
              <strong>Untuk template &gt;5 pegawai:</strong> Fix table loop agar wrap entire row
            </li>
            <li>Save template files</li>
            <li>Copy ke folder <code className="bg-muted px-1 rounded">public/templates/</code></li>
            <li>Test generate dokumen dengan berbagai jumlah pegawai</li>
            <li>Validasi hasil dokumen bisa dibuka dan format sesuai</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};

export default TemplateSetupGuide;
