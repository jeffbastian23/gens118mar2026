import { Bell, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const AppHeader = () => (
  <header className="h-14 px-6 flex items-center justify-between shrink-0">
    <div className="flex items-center gap-2 text-[13px]">
      <span className="text-muted-foreground">Workspace</span>
      <span className="text-muted-foreground">/</span>
      <span className="font-medium text-foreground">Dashboard</span>
    </div>
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon" className="w-8 h-8 rounded-md">
        <Bell className="w-4 h-4 text-muted-foreground" />
      </Button>
      <Button size="sm" className="h-8 px-3 text-[13px] rounded-md gap-1.5">
        <Plus className="w-3.5 h-3.5" />
        New
      </Button>
    </div>
  </header>
);

export default AppHeader;
