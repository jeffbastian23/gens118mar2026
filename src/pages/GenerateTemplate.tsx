import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, BookOpen, AlertCircle } from "lucide-react";
import { downloadNDTemplateSmallGroup, downloadNDTemplateLargeGroup } from "@/utils/createNDTemplate";
import { downloadSTTemplateSmallGroup, downloadSTTemplateLargeGroup } from "@/utils/createSTTemplate";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import TemplateDownloads from "@/components/TemplateDownloads";

const GenerateTemplate = () => {
  const navigate = useNavigate();
  const handleDownloadNDTemplateSmall = async () => {
    try {
      toast.info("Generating ND template (≤5 pegawai)...");
      await downloadNDTemplateSmallGroup();
      toast.success("Template ND (≤5 pegawai) berhasil di-generate! Silakan copy file ke public/templates/");
    } catch (error) {
      console.error("Error generating ND template:", error);
      toast.error("Gagal generate template ND");
    }
  };

  const handleDownloadNDTemplateLarge = async () => {
    try {
      toast.info("Generating ND template (>5 pegawai)...");
      await downloadNDTemplateLargeGroup();
      toast.success("Template ND (>5 pegawai) berhasil di-generate! Silakan copy file ke public/templates/");
    } catch (error) {
      console.error("Error generating ND template:", error);
      toast.error("Gagal generate template ND");
    }
  };

  const handleDownloadSTTemplateSmall = async () => {
    try {
      toast.info("Generating ST template (≤5 pegawai)...");
      await downloadSTTemplateSmallGroup();
      toast.success("Template ST (≤5 pegawai) berhasil di-generate! Silakan copy file ke public/templates/");
    } catch (error) {
      console.error("Error generating ST template:", error);
      toast.error("Gagal generate template ST");
    }
  };

  const handleDownloadSTTemplateLarge = async () => {
    try {
      toast.info("Generating ST template (>5 pegawai)...");
      await downloadSTTemplateLargeGroup();
      toast.success("Template ST (>5 pegawai) berhasil di-generate! Silakan copy file ke public/templates/");
    } catch (error) {
      console.error("Error generating ST template:", error);
      toast.error("Gagal generate template ST");
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>
            Setelah download template, Anda perlu edit manual di Word untuk menambahkan conditional sections dan fix table loops.
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/template-setup-guide")}
          >
            <BookOpen className="mr-2 h-4 w-4" />
            Panduan Setup
          </Button>
        </AlertDescription>
      </Alert>
      <TemplateDownloads />
      {/* Nota Dinas Template Section */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Template Nota Dinas</CardTitle>
          <CardDescription>
            Utility untuk membuat template Word Nota Dinas dengan placeholder docxtemplater
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Template ≤5 Pegawai</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Generate template Word untuk Nota Dinas dengan jumlah pegawai kurang dari atau sama dengan 5 orang (format daftar).
            </p>
            <Button onClick={handleDownloadNDTemplateSmall}>
              <Download className="mr-2 h-4 w-4" />
              Download Template ND (≤5)
            </Button>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-2">Template &gt;5 Pegawai</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Generate template Word untuk Nota Dinas dengan jumlah pegawai lebih dari 5 orang (format tabel dengan loop dinamis).
            </p>
            <Button onClick={handleDownloadNDTemplateLarge}>
              <Download className="mr-2 h-4 w-4" />
              Download Template ND (&gt;5)
            </Button>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-3">Placeholder yang Digunakan:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Informasi Dokumen:</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>&lt;&lt;Nomor ND&gt;&gt;</li>
                  <li>&lt;&lt;Tanggal Surat&gt;&gt;</li>
                  <li>&lt;&lt;Unit Penerbit&gt;&gt;</li>
                  <li>&lt;&lt;Unit Pemohon&gt;&gt;</li>
                  <li>&lt;&lt;Nama Kegiatan&gt;&gt;</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Dasar Penugasan:</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>&lt;&lt;Dasar Penugasan&gt;&gt;</li>
                  <li>&lt;&lt;Nomor Naskah Dinas&gt;&gt;</li>
                  <li>&lt;&lt;Tanggal Naskah Dinas&gt;&gt;</li>
                  <li>&lt;&lt;Perihal&gt;&gt;</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Data Pegawai (1-5):</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>&lt;&lt;Nama Pegawai 1&gt;&gt;</li>
                  <li>&lt;&lt;Pangkat Pegawai 1&gt;&gt;</li>
                  <li>&lt;&lt;Jabatan Pegawai 1&gt;&gt;</li>
                  <li className="text-xs italic">... hingga Pegawai 5</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Detail Penugasan:</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>&lt;&lt;Tujuan Penugasan&gt;&gt;</li>
                  <li>&lt;&lt;Tanggal Kegiatan&gt;&gt;</li>
                  <li>&lt;&lt;Waktu Penugasan&gt;&gt;</li>
                  <li>&lt;&lt;Tempat Penugasan&gt;&gt;</li>
                  <li>&lt;&lt;Alamat Penugasan&gt;&gt;</li>
                </ul>
              </div>

              <div className="md:col-span-2">
                <h4 className="font-medium mb-2">Pejabat Penandatangan:</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>&lt;&lt;Pejabat Penandatangan&gt;&gt;</li>
                  <li>&lt;&lt;Pangkat Pejabat&gt;&gt;</li>
                  <li>&lt;&lt;Jabatan Pejabat&gt;&gt;</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="border-t pt-6 bg-muted p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Instruksi:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Pilih template yang sesuai dengan jumlah pegawai (≤5 atau &gt;5)</li>
              <li>Klik tombol download yang sesuai</li>
              <li>File akan ter-download dengan nama:
                <ul className="list-disc list-inside ml-6 mt-2">
                  <li><code className="bg-background px-2 py-1 rounded">ND_Kegiatan_kurang_dari_sama_dengan_5_pegawai.docx</code></li>
                  <li><code className="bg-background px-2 py-1 rounded">ND_Kegiatan_lebih_dari_5_pegawai.docx</code></li>
                </ul>
              </li>
              <li>Copy file tersebut ke folder: <code className="bg-background px-2 py-1 rounded">public/templates/</code></li>
              <li>Replace file lama jika ada</li>
              <li>Template siap digunakan untuk generate Nota Dinas</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Surat Tugas Template Section */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Template Surat Tugas</CardTitle>
          <CardDescription>
            Utility untuk membuat template Word Surat Tugas dengan placeholder docxtemplater
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Template for ≤5 employees */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Template ≤5 Pegawai</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Generate template Word untuk Surat Tugas dengan jumlah pegawai kurang dari atau sama dengan 5 orang (format daftar).
            </p>
            <Button onClick={handleDownloadSTTemplateSmall}>
              <Download className="mr-2 h-4 w-4" />
              Download Template ST (≤5)
            </Button>
          </div>

          {/* Template for >5 employees */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-2">Template &gt;5 Pegawai</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Generate template Word untuk Surat Tugas dengan jumlah pegawai lebih dari 5 orang (format tabel).
            </p>
            <Button onClick={handleDownloadSTTemplateLarge}>
              <Download className="mr-2 h-4 w-4" />
              Download Template ST (&gt;5)
            </Button>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-3">Placeholder yang Digunakan:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Informasi Dokumen:</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>&lt;&lt;Nomor ST&gt;&gt;</li>
                  <li>&lt;&lt;Tanggal Surat&gt;&gt;</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Dasar Penugasan:</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>&lt;&lt;Dasar Penugasan&gt;&gt;</li>
                  <li>&lt;&lt;Nomor Naskah Dinas&gt;&gt;</li>
                  <li>&lt;&lt;Tanggal Naskah Dinas&gt;&gt;</li>
                  <li>&lt;&lt;Perihal&gt;&gt;</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Data Pegawai (≤5):</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>&lt;&lt;Nama Pegawai 1&gt;&gt;</li>
                  <li>&lt;&lt;Pangkat Pegawai 1&gt;&gt;</li>
                  <li>&lt;&lt;Jabatan Pegawai 1&gt;&gt;</li>
                  <li className="text-xs italic">... hingga Pegawai 5</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Data Pegawai (&gt;5):</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>&#123;#pegawai&#125; &#123;index&#125; &#123;/pegawai&#125;</li>
                  <li>&#123;#pegawai&#125; &#123;nama&#125; &#123;/pegawai&#125;</li>
                  <li>&#123;#pegawai&#125; &#123;pangkat&#125; &#123;/pegawai&#125;</li>
                  <li>&#123;#pegawai&#125; &#123;jabatan&#125; &#123;/pegawai&#125;</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Detail Penugasan:</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>&lt;&lt;Tujuan Penugasan&gt;&gt;</li>
                  <li>&lt;&lt;Tanggal Kegiatan&gt;&gt;</li>
                  <li>&lt;&lt;Tempat Penugasan&gt;&gt;</li>
                  <li>&lt;&lt;Alamat Penugasan&gt;&gt;</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Pejabat Penandatangan:</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>&lt;&lt;Pejabat Penandatangan&gt;&gt;</li>
                  <li>&lt;&lt;NIP Pejabat&gt;&gt;</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="border-t pt-6 bg-muted p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Instruksi:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Pilih template yang sesuai dengan jumlah pegawai (≤5 atau &gt;5)</li>
              <li>Klik tombol download yang sesuai</li>
              <li>File akan ter-download dengan nama:
                <ul className="list-disc list-inside ml-6 mt-2">
                  <li><code className="bg-background px-2 py-1 rounded">ST_Kegiatan_kurang_dari_sama_dengan_5_pegawai.docx</code></li>
                  <li><code className="bg-background px-2 py-1 rounded">ST_Kegiatan_lebih_dari_5_pegawai.docx</code></li>
                </ul>
              </li>
              <li>Copy file tersebut ke folder: <code className="bg-background px-2 py-1 rounded">public/templates/</code></li>
              <li>Replace file lama jika ada</li>
              <li>Sesuaikan format di Word (font, spacing, dll) sesuai kebutuhan</li>
              <li>Template siap digunakan untuk generate Surat Tugas</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GenerateTemplate;
