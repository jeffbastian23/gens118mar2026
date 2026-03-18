import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Power, PowerOff, Zap, Loader2, Plus, Check, X, User, Mail, Edit, Trash2, Clock, Users, FileSpreadsheet, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import * as XLSX from "xlsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface WorkSession {
  id: string;
  status: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  tasks: string | null;
  notes: string | null;
}

interface DigitalFootprintDatabaseProps {
  sessions: WorkSession[];
  onRefresh: () => void;
}

interface UserProfile {
  user_id: string;
  full_name: string | null;
  email: string;
}

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}j ${mins}m` : `${mins}m`;
};

interface TaskItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
  userName: string;
  userEmail: string;
}

export default function DigitalFootprintDatabase({ sessions, onRefresh }: DigitalFootprintDatabaseProps) {
  const { fullName, user, role } = useAuth();
  const canEdit = role !== "overview";
  const [isWorking, setIsWorking] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [newTaskText, setNewTaskText] = useState("");
  const [recordFor, setRecordFor] = useState<"self" | "team">("self");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  const [editingSession, setEditingSession] = useState<WorkSession | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const lastActivityRef = useRef<number>(Date.now());
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const INACTIVITY_THRESHOLD = 5 * 60 * 1000;

  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  useEffect(() => {
    checkCurrentSession();
    loadTasksFromDatabase();
    fetchAllUsers();
    // Initialize selected user to current user for "self" mode
    if (user?.id) {
      setSelectedUserId(user.id);
    }
  }, [user?.id]);

  const fetchAllUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("user_id, full_name, email")
      .order("full_name");
    
    if (error) {
      console.error("Error fetching users:", error);
      return;
    }
    
    setAllUsers(data || []);
  };

  useEffect(() => {
    if (!isAutoMode || !isWorking) return;

    const handleVisibilityChange = () => {
      if (document.hidden && isWorking && isAutoMode) {
        handleStopWork(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAutoMode, isWorking, currentSessionId]);

  const loadTasksFromDatabase = async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from("digital_footprint_tasks" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading tasks:", error);
      toast.error("Gagal memuat tugas. Pastikan tabel sudah dibuat di database.");
      return;
    }

    const loadedTasks: TaskItem[] = (data || []).map((task: any) => ({
      id: task.id,
      text: task.task_text,
      completed: task.completed,
      createdAt: task.created_at,
      userName: task.user_name,
      userEmail: task.user_email
    }));

    setTasks(loadedTasks);
  };

  const addTask = async () => {
    if (!newTaskText.trim() || !user?.id) return;

    try {
      const { data, error } = await supabase
        .from("digital_footprint_tasks" as any)
        .insert({
          user_id: user.id,
          task_text: newTaskText.trim(),
          completed: false,
          user_name: fullName || "User",
          user_email: user.email || "-"
        })
        .select()
        .single();

      if (error) {
        console.error("Error adding task:", error);
        toast.error("Gagal menambahkan tugas: " + error.message);
        return;
      }

      if (!data) {
        toast.error("Data tugas tidak diterima");
        return;
      }

      const taskData = data as any;
      const newTask: TaskItem = {
        id: taskData.id,
        text: taskData.task_text,
        completed: taskData.completed,
        createdAt: taskData.created_at,
        userName: taskData.user_name,
        userEmail: taskData.user_email
      };

      setTasks([newTask, ...tasks]);
      setNewTaskText("");
      toast.success("Tugas berhasil ditambahkan");
    } catch (err) {
      console.error("Exception adding task:", err);
      toast.error("Terjadi kesalahan saat menambahkan tugas");
    }
  };

  const toggleTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const { error } = await supabase
      .from("digital_footprint_tasks" as any)
      .update({ completed: !task.completed })
      .eq("id", taskId);

    if (error) {
      toast.error("Gagal mengupdate tugas");
      return;
    }

    const updatedTasks = tasks.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    setTasks(updatedTasks);
  };

  const removeTask = async (taskId: string) => {
    const { error } = await supabase
      .from("digital_footprint_tasks" as any)
      .delete()
      .eq("id", taskId);

    if (error) {
      toast.error("Gagal menghapus tugas");
      return;
    }

    setTasks(tasks.filter(t => t.id !== taskId));
    toast.success("Tugas berhasil dihapus");
  };

  useEffect(() => {
    if (!isAutoMode || !isWorking) return;

    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, updateActivity);
    });

    inactivityTimerRef.current = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;
      if (timeSinceLastActivity > INACTIVITY_THRESHOLD && isWorking) {
        handleStopWork(true);
      }
    }, 30000);

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
      if (inactivityTimerRef.current) {
        clearInterval(inactivityTimerRef.current);
      }
    };
  }, [isAutoMode, isWorking]);

  const checkCurrentSession = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("digital_footprint")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "on")
      .is("ended_at", null)
      .order("started_at", { ascending: false })
      .limit(1)
      .single();

    if (data) {
      setIsWorking(true);
      setCurrentSessionId(data.id);
      setIsAutoMode(data.tasks?.includes("Otomatis") || false);
    }
  };

  const handleStartWork = async (autoMode: boolean = false) => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Anda harus login terlebih dahulu");
      setIsLoading(false);
      return;
    }

    // Validate user selection for team mode
    if (recordFor === "team" && !selectedUserId) {
      toast.error("Pilih pengguna terlebih dahulu");
      setIsLoading(false);
      return;
    }

    const targetUserId = recordFor === "team" ? selectedUserId : user.id;
    const targetUser = recordFor === "team" 
      ? allUsers.find(u => u.user_id === selectedUserId)
      : { full_name: fullName, email: user.email };

    const modeLabel = autoMode ? "Mode Otomatis" : "Mode Manual";
    const recordLabel = recordFor === "team" ? " (Tim)" : "";

    const { data, error } = await supabase
      .from("digital_footprint")
      .insert({
        user_id: targetUserId,
        status: "on",
        tasks: modeLabel + recordLabel,
        notes: `${targetUser?.full_name || targetUser?.email || 'User'} - Mulai kerja ${autoMode ? '(Otomatis)' : '(Manual)'}${recordLabel}`
      })
      .select()
      .single();

    if (error) {
      toast.error("Gagal memulai sesi kerja");
      setIsLoading(false);
      return;
    }

    setIsWorking(true);
    setCurrentSessionId(data.id);
    setIsAutoMode(autoMode);
    lastActivityRef.current = Date.now();
    toast.success(`Sesi kerja dimulai ${autoMode ? '(Mode Otomatis)' : '(Mode Manual)'}${recordLabel}`);
    setIsLoading(false);
    onRefresh();
  };

  const handleStopWork = async (isAutoStop: boolean = false) => {
    if (!currentSessionId) return;
    setIsLoading(true);

    const { data: currentSession } = await supabase
      .from("digital_footprint")
      .select("started_at")
      .eq("id", currentSessionId)
      .single();

    if (!currentSession) {
      setIsLoading(false);
      return;
    }

    const startTime = new Date(currentSession.started_at);
    const endTime = new Date();
    const durationMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / 1000 / 60);

    const { error } = await supabase
      .from("digital_footprint")
      .update({
        status: "off",
        ended_at: endTime.toISOString(),
        duration_minutes: durationMinutes,
        notes: isAutoStop ? "Berhenti otomatis (Inaktif)" : "Berhenti manual"
      })
      .eq("id", currentSessionId);

    if (error) {
      toast.error("Gagal menghentikan sesi kerja");
      setIsLoading(false);
      return;
    }

    setIsWorking(false);
    setCurrentSessionId(null);
    setIsAutoMode(false);
    toast.success(`Sesi kerja selesai. Durasi: ${durationMinutes} menit`);
    setIsLoading(false);
    onRefresh();
  };

  const handleDeleteSession = async () => {
    if (!deleteSessionId) return;

    const { error } = await supabase
      .from("digital_footprint")
      .delete()
      .eq("id", deleteSessionId);

    if (error) {
      toast.error("Gagal menghapus sesi");
      return;
    }

    toast.success("Sesi berhasil dihapus");
    setDeleteSessionId(null);
    onRefresh();
  };

  const handleEditSession = async () => {
    if (!editingSession) return;

    const { error } = await supabase
      .from("digital_footprint")
      .update({ notes: editNotes })
      .eq("id", editingSession.id);

    if (error) {
      toast.error("Gagal mengupdate sesi");
      return;
    }

    toast.success("Sesi berhasil diupdate");
    setEditingSession(null);
    setEditNotes("");
    onRefresh();
  };

  const getTimeLapse = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} hari lalu`;
    if (diffHours > 0) return `${diffHours} jam lalu`;
    if (diffMins > 0) return `${diffMins} menit lalu`;
    return "Baru saja";
  };

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Panel Kontrol Kerja</CardTitle>
          <CardDescription>
            {isWorking ? `Sesi kerja sedang berjalan (${isAutoMode ? 'Mode Otomatis' : 'Mode Manual'})` : "Mulai sesi kerja baru"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* User Info */}
          <div className="flex flex-col sm:flex-row gap-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{fullName || "User"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{user?.email || "-"}</span>
            </div>
          </div>

          {/* Record For Selection - Admin only */}
          {role === "admin" && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Rekam untuk:</span>
                <Select value={recordFor} onValueChange={(v) => {
                  setRecordFor(v as "self" | "team");
                  if (v === "self") {
                    setSelectedUserId(user?.id || "");
                  }
                }}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="self">Pribadi ({fullName?.split(' ')[0] || user?.email?.split('@')[0] || "Saya"})</SelectItem>
                    <SelectItem value="team">Tim/Teman</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* User Selection for Team Mode */}
              {recordFor === "team" && (
                <div className="ml-6 space-y-2">
                  <label className="text-sm font-medium">Pilih Pengguna:</label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih nama lengkap dan email" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {allUsers.map((u) => (
                        <SelectItem key={u.user_id} value={u.user_id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{u.full_name || "User"}</span>
                            <span className="text-xs text-muted-foreground">{u.email}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {canEdit && (
            <div className="flex gap-2 flex-wrap">
              {!isWorking ? (
                <>
                  <Button onClick={() => handleStartWork(false)} size="lg" disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Power className="w-4 h-4 mr-2" />}
                    Mulai Kerja (Manual)
                  </Button>
                  <Button onClick={() => handleStartWork(true)} size="lg" variant="secondary" disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                    Mulai Kerja (Otomatis)
                  </Button>
                </>
              ) : (
                <Button onClick={() => handleStopWork()} size="lg" variant="destructive" disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PowerOff className="w-4 h-4 mr-2" />}
                  Selesai Kerja
                </Button>
              )}
            </div>
          )}
          {isAutoMode && isWorking && (
            <p className="text-sm text-muted-foreground">
              Mode Otomatis aktif: Timer akan berhenti otomatis saat device sleep/tab hidden atau setelah 5 menit tidak ada aktivitas.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Task Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Tugas</CardTitle>
          <CardDescription>Kelola checklist tugas harian Anda</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Task */}
          {canEdit && (
            <div className="flex gap-2">
              <Input
                placeholder="Tambah tugas baru..."
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTask()}
                className="flex-1"
              />
              <Button onClick={addTask} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Task List */}
          {tasks.length > 0 ? (
            <div className="space-y-2">
              {tasks.map((task) => (
                <div 
                  key={task.id} 
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    task.completed ? 'bg-green-50 border-green-200' : 'bg-card border-border'
                  }`}
                >
                  <Button
                    variant={task.completed ? "default" : "outline"}
                    size="icon"
                    className={`h-8 w-8 shrink-0 ${task.completed ? 'bg-green-500 hover:bg-green-600' : ''}`}
                    onClick={() => toggleTask(task.id)}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <div className="flex-1 min-w-0">
                    <span className={`block ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {task.text}
                    </span>
                    <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {task.userName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {task.userEmail}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {getTimeLapse(task.createdAt)}
                      </span>
                    </div>
                  </div>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => removeTask(task.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">Belum ada tugas</p>
          )}

          {/* Completion Stats */}
          {totalTasks > 0 && (
            <div className="space-y-2 pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span>Progress Tugas</span>
                <span>{completedTasks} / {totalTasks} Selesai</span>
              </div>
              <div className="flex gap-1 h-4">
                <div 
                  className="bg-green-500 rounded-l transition-all"
                  style={{ width: `${completionPercentage}%` }}
                />
                <div 
                  className="bg-red-500 rounded-r transition-all"
                  style={{ width: `${100 - completionPercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-green-600">● Selesai ({completedTasks})</span>
                <span className="text-red-600">● Belum Selesai ({totalTasks - completedTasks})</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session History */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <CardTitle>Riwayat Sesi Kerja</CardTitle>
              <CardDescription>20 sesi kerja terakhir</CardDescription>
            </div>
            {role === "admin" && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => {
                  const exportData = sessions.map((s, i) => ({
                    "No": i + 1,
                    "Tanggal": format(new Date(s.started_at), "dd/MM/yyyy"),
                    "Mulai": format(new Date(s.started_at), "HH:mm:ss"),
                    "Selesai": s.ended_at ? format(new Date(s.ended_at), "HH:mm:ss") : "-",
                    "Durasi (menit)": s.duration_minutes || 0,
                    "Task": s.tasks || "-",
                    "Catatan": s.notes || "-"
                  }));
                  const ws = XLSX.utils.json_to_sheet(exportData);
                  const wb = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(wb, ws, "Digital Footprint");
                  XLSX.writeFile(wb, `digital_footprint_${format(new Date(), "yyyyMMdd_HHmmss")}.xlsx`);
                  toast.success("Data berhasil diekspor");
                }}>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Export Excel
                </Button>
                <label>
                  <Button variant="outline" asChild>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      Import Excel
                    </span>
                  </Button>
                  <input type="file" accept=".xlsx,.xls" className="hidden" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = async (evt) => {
                      const data = new Uint8Array(evt.target?.result as ArrayBuffer);
                      const wb = XLSX.read(data, { type: "array" });
                      const ws = wb.Sheets[wb.SheetNames[0]];
                      const jsonData = XLSX.utils.sheet_to_json(ws);
                      let imported = 0;
                      for (const row of jsonData as any[]) {
                        const { error } = await supabase.from("digital_footprint").insert({
                          user_id: user?.id,
                          status: "off",
                          duration_minutes: parseInt(row["Durasi (menit)"]) || 0,
                          tasks: row["Task"] !== "-" ? row["Task"] : null,
                          notes: row["Catatan"] !== "-" ? row["Catatan"] : null
                        });
                        if (!error) imported++;
                      }
                      toast.success(`${imported} data berhasil diimport`);
                      onRefresh();
                    };
                    reader.readAsArrayBuffer(file);
                    e.target.value = "";
                  }} />
                </label>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Belum ada riwayat sesi kerja</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessions.map((session) => {
                const notesParts = session.notes?.split(' - ') || [];
                const userName = notesParts[0] || fullName || "User";
                const userEmail = user?.email || "-";
                
                return (
                  <div key={session.id} className="border rounded-lg p-4 space-y-2 bg-card">
                    <div className="flex justify-between items-start">
                      <p className="font-medium text-sm">
                        {format(new Date(session.started_at), "EEEE, dd MMM yyyy", { locale: id })}
                      </p>
                      {session.duration_minutes !== null && (
                        <span className="font-semibold text-primary text-sm">
                          {formatDuration(session.duration_minutes)}
                        </span>
                      )}
                    </div>
                    
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div className="flex justify-between">
                        <span>Mulai (Aktif):</span>
                        <span className="text-green-600">{format(new Date(session.started_at), "HH:mm:ss")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Selesai (Inaktif):</span>
                        <span className="text-red-600">
                          {session.ended_at ? format(new Date(session.ended_at), "HH:mm:ss") : "Berlangsung"}
                        </span>
                      </div>
                    </div>
                    
                    {session.tasks && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground">Task:</p>
                        <p className="text-sm">{session.tasks}</p>
                      </div>
                    )}
                    
                    {/* User Info in Session Card */}
                    <div className="pt-2 border-t space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3 text-muted-foreground" />
                        <p className="text-xs font-medium">{userName}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-3 h-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                      </div>
                    </div>

                    {/* Edit & Delete Buttons */}
                    {canEdit && (
                      <div className="pt-2 border-t flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setEditingSession(session);
                            setEditNotes(session.notes || "");
                          }}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-destructive hover:text-destructive"
                          onClick={() => setDeleteSessionId(session.id)}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Hapus
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteSessionId} onOpenChange={() => setDeleteSessionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Sesi Kerja?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus sesi kerja ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSession} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Session Dialog */}
      <AlertDialog open={!!editingSession} onOpenChange={() => setEditingSession(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Sesi Kerja</AlertDialogTitle>
            <AlertDialogDescription>
              Update catatan untuk sesi kerja ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="Catatan sesi..."
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleEditSession}>
              Simpan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
