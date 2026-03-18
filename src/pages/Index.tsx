import AppSidebar from "@/components/AppSidebar";
import AppHeader from "@/components/AppHeader";
import EmptyState from "@/components/EmptyState";
import { motion } from "framer-motion";

const Index = () => (
  <div className="flex h-screen bg-background">
    <AppSidebar />
    <div className="flex-1 flex flex-col min-w-0">
      <AppHeader />
      <motion.main
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        className="flex-1 overflow-auto p-8"
      >
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">Dashboard</h1>
            <p className="text-[13px] text-muted-foreground mt-1">Welcome to your workspace.</p>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: "Projects", value: "0" },
              { label: "Team Members", value: "1" },
              { label: "Tasks", value: "0" },
            ].map((stat) => (
              <div key={stat.label} className="bg-card rounded-xl shadow-card p-5 hover:shadow-card-hover transition-shadow duration-150">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{stat.label}</span>
                <p className="text-2xl font-semibold text-foreground tracking-tight mt-1">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-card rounded-xl shadow-card">
            <div className="px-6 py-4">
              <h3 className="text-[15px] font-semibold text-foreground tracking-tight">Recent Projects</h3>
              <p className="text-[13px] text-muted-foreground mt-0.5">Manage your latest project updates.</p>
            </div>
            <EmptyState />
          </div>
        </div>
      </motion.main>
    </div>
  </div>
);

export default Index;
