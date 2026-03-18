import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SlidersHorizontal } from "lucide-react";

export const PropertyFilters = () => {
  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-[var(--card-shadow)]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center text-foreground">
          <SlidersHorizontal className="w-5 h-5 mr-2" />
          Filter Properti
        </h2>
        <Button variant="ghost" size="sm" className="text-primary">
          Reset
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Tipe Properti" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="studio">Studio</SelectItem>
            <SelectItem value="1br">1 Kamar Tidur</SelectItem>
            <SelectItem value="2br">2 Kamar Tidur</SelectItem>
            <SelectItem value="3br">3+ Kamar Tidur</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Harga" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Rp 1-3 Juta</SelectItem>
            <SelectItem value="2">Rp 3-5 Juta</SelectItem>
            <SelectItem value="3">Rp 5-10 Juta</SelectItem>
            <SelectItem value="4">Rp 10+ Juta</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Lokasi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="jakarta">Jakarta</SelectItem>
            <SelectItem value="bandung">Bandung</SelectItem>
            <SelectItem value="surabaya">Surabaya</SelectItem>
            <SelectItem value="yogyakarta">Yogyakarta</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Ukuran" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">0-30 m²</SelectItem>
            <SelectItem value="2">30-50 m²</SelectItem>
            <SelectItem value="3">50-100 m²</SelectItem>
            <SelectItem value="4">100+ m²</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
