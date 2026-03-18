import { FolderKanban, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const EmptyState = () => (
  <motion.div
    initial={{ opacity: 0, y: 4 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
    className="flex flex-col items-center justify-center py-24"
  >
    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-6">
      <FolderKanban className="w-7 h-7 text-muted-foreground" strokeWidth={1.5} />
    </div>
    <h2 className="text-[15px] font-semibold text-foreground tracking-tight mb-1">No projects yet</h2>
    <p className="text-[13px] text-muted-foreground mb-6">Create your first project to get started.</p>
    <Button size="sm" className="h-9 px-4 text-[13px] rounded-lg gap-2 active:scale-[0.98] transition-transform duration-150">
      <Plus className="w-3.5 h-3.5" />
      Create Project
    </Button>
  </motion.div>
);

export default EmptyState;
