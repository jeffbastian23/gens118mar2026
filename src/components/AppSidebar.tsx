import { LayoutDashboard, FolderKanban, Users, Settings, Search } from "lucide-react";
import { useState } from "react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: FolderKanban, label: "Projects" },
  { icon: Users, label: "Team" },
  { icon: Settings, label: "Settings" },
];

const AppSidebar = () => {
  const [active, setActive] = useState("Dashboard");

  return (
    <aside className="w-64 h-screen bg-sidebar flex flex-col p-4 shrink-0">
      <div className="flex items-center gap-2 px-3 py-2 mb-6">
        <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center">
          <span className="text-background text-xs font-semibold">V</span>
        </div>
        <span className="text-[15px] font-semibold text-foreground tracking-tight">Workspace</span>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search..."
          className="w-full h-8 pl-9 pr-3 rounded-md bg-background text-[13px] text-foreground placeholder:text-muted-foreground shadow-card outline-none focus:shadow-card-hover transition-shadow duration-150"
        />
      </div>

      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground px-3 mb-2">Menu</span>

      <nav className="flex flex-col gap-1">
        {navItems.map(({ icon: Icon, label }) => (
          <button
            key={label}
            onClick={() => setActive(label)}
            className={`flex items-center gap-3 px-3 py-2 w-full rounded-md text-[13px] font-medium transition-all duration-150 group ${
              active === label
                ? "text-sidebar-active bg-background shadow-ring"
                : "text-sidebar-foreground hover:text-sidebar-active hover:bg-background hover:shadow-ring"
            }`}
          >
            <Icon className={`w-4 h-4 ${active === label ? "text-sidebar-active" : "text-muted-foreground group-hover:text-sidebar-active"}`} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto px-3 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <span className="text-[11px] font-semibold text-muted-foreground">U</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] font-medium text-foreground">User</span>
            <span className="text-[11px] text-muted-foreground">user@email.com</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
