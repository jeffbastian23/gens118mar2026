import { useState } from "react";
import { Database, GraduationCap, Users, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import DataPokokTable from "./DataPokokTable";
import PensiunTable from "./PensiunTable";
import PendidikanTable from "./PendidikanTable";

type DataView = "datapokok" | "pensiun" | "pendidikan" | null;

export default function DataSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeView, setActiveView] = useState<DataView>(null);

  const menuItems = [
    { id: "datapokok" as DataView, label: "Data Pokok", icon: Database },
    { id: "pensiun" as DataView, label: "Pensiun", icon: Users },
    { id: "pendidikan" as DataView, label: "Pendidikan", icon: GraduationCap },
  ];

  const handleMenuClick = (view: DataView) => {
    if (activeView === view) {
      setActiveView(null);
    } else {
      setActiveView(view);
      setIsOpen(true);
    }
  };

  return (
    <>
      {/* Sidebar trigger - always visible on left */}
      <div 
        className="fixed left-0 top-24 z-50 group"
        onMouseEnter={() => !isCollapsed && setIsOpen(true)}
      >
        <div className={cn(
          "bg-card border-r border-t border-b rounded-r-lg shadow-lg transition-all duration-300",
          isOpen && !isCollapsed ? "w-64" : "w-12"
        )}>
          {/* Collapse/Expand button */}
          <div className="p-2 border-b">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-center px-2"
              onClick={() => {
                setIsCollapsed(!isCollapsed);
                if (!isCollapsed) {
                  setIsOpen(false);
                  setActiveView(null);
                }
              }}
              title={isCollapsed ? "Expand" : "Collapse"}
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
          
          {/* Menu items */}
          <div className="p-2 space-y-2">
            {menuItems.map((item) => (
              <Button
                key={item.id}
                variant={activeView === item.id ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start transition-all",
                  (isCollapsed || !isOpen) && "justify-center px-2"
                )}
                onClick={() => handleMenuClick(item.id)}
                disabled={isCollapsed}
              >
                <item.icon className="h-4 w-4" />
                {isOpen && !isCollapsed && (
                  <>
                    <span className="ml-2 flex-1 text-left">{item.label}</span>
                    <ChevronRight className={cn(
                      "h-4 w-4 transition-transform",
                      activeView === item.id && "rotate-90"
                    )} />
                  </>
                )}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Content panel */}
      {activeView && (
        <div 
          className="fixed left-64 top-24 bottom-0 right-0 z-40 bg-background/95 backdrop-blur-sm overflow-auto"
          onMouseLeave={() => {
            setIsOpen(false);
            setActiveView(null);
          }}
        >
          <div className="container mx-auto px-4 py-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">
                {menuItems.find(m => m.id === activeView)?.label}
              </h2>
              <Button 
                variant="outline" 
                onClick={() => {
                  setActiveView(null);
                  setIsOpen(false);
                }}
              >
                Tutup
              </Button>
            </div>
            
            {activeView === "datapokok" && <DataPokokTable />}
            {activeView === "pensiun" && <PensiunTable />}
            {activeView === "pendidikan" && <PendidikanTable />}
          </div>
        </div>
      )}
    </>
  );
}
