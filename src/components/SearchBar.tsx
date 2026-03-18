import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export const SearchBar = () => {
  return (
    <div className="flex flex-col md:flex-row gap-3 w-full max-w-4xl">
      <Input
        type="text"
        placeholder="Cari berdasarkan lokasi..."
        className="flex-1 h-14 text-base bg-card border-border"
      />
      <Button className="h-14 px-8 bg-primary hover:bg-primary/90 text-primary-foreground">
        <Search className="w-5 h-5 mr-2" />
        Cari Properti
      </Button>
    </div>
  );
};
