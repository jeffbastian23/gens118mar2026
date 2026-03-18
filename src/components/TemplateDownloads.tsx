import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";
import { toast } from "sonner";

const templates = [
  {
    title: "ND PLH",
    filename: "ND_PLH.docx",
    path: "/templates/ND_PLH.docx",
  },
  {
    title: "ND PLT",
    filename: "ND_PLT.docx",
    path: "/templates/ND_PLT.docx",
  },
  {
    title: "PRIN PLH",
    filename: "Prin_PLH.docx",
    path: "/templates/Prin_PLH.docx",
  },
  {
    title: "PRIN PLT",
    filename: "Prin_PLT.docx",
    path: "/templates/Prin_PLT.docx",
  },
];

async function downloadTemplate(path: string, filename: string) {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error("Template tidak ditemukan");
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    toast.success(`Template ${filename} berhasil didownload`);
  } catch (error) {
    console.error("Error downloading template:", error);
    toast.error("Gagal mendownload template");
  }
}

export default function TemplateDownloads() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Template PLH/PLT Kepala (Format DOCX)</CardTitle>
        <CardDescription>
          Download template DOCX resmi yang tersimpan di folder publik dan sync dengan GitHub.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((template) => (
          <div key={template.filename} className="space-y-2">
            <h4 className="font-medium">{template.title}</h4>
            <Button onClick={() => downloadTemplate(template.path, template.filename)}>
              <Download className="mr-2 h-4 w-4" /> Download Template {template.title}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
