import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Plus, Camera, ChevronLeft, ChevronRight, Upload, Archive, Eye, Share2, Sparkles, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Story {
  id: string;
  user_id: string;
  user_email: string | null;
  user_name: string | null;
  user_role: string | null;
  image_url: string;
  caption: string | null;
  created_at: string;
  expires_at: string;
  views_count: number;
  viewed_by: string[];
}

interface StoryComment {
  id: string;
  story_id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  comment: string;
  created_at: string;
}

interface GroupedStories {
  user_id: string;
  user_email: string;
  user_name: string;
  avatar?: string;
  stories: Story[];
  hasUnviewed: boolean;
}

interface InstagramStoriesProps {
  currentUserId: string;
  currentUserEmail: string;
  currentUserName: string;
  currentUserRole: string;
}

export default function InstagramStories({
  currentUserId,
  currentUserEmail,
  currentUserName,
  currentUserRole,
}: InstagramStoriesProps) {
  const [stories, setStories] = useState<Story[]>([]);
  const [groupedStories, setGroupedStories] = useState<GroupedStories[]>([]);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [newCaption, setNewCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);
  const [progress, setProgress] = useState(0);
  const [viewersDialogOpen, setViewersDialogOpen] = useState(false);
  
  // Comment states
  const [comments, setComments] = useState<StoryComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);

  useEffect(() => {
    fetchStories();
    // Cleanup expired stories
    const interval = setInterval(fetchStories, 120000); // Reduced from 60s to 120s
    return () => clearInterval(interval);
  }, [currentUserRole]);

  const fetchStories = async () => {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("stories")
        .select("*")
        .gt("expires_at", now)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const validStories = (data || []) as Story[];
      setStories(validStories);

      // Fetch user avatars from profiles
      const userIds = [...new Set(validStories.map(s => s.user_id))];
      const { data: profiles } = userIds.length > 0 ? await supabase
        .from("profiles")
        .select("user_id")
        .in("user_id", userIds) : { data: [] };

      // Avatar no longer fetched from profiles to reduce egress

      // Group stories by user
      const grouped = validStories.reduce((acc: GroupedStories[], story) => {
        const existingGroup = acc.find(g => g.user_id === story.user_id);
        const hasUnviewed = !story.viewed_by?.includes(currentUserEmail);
        
        if (existingGroup) {
          existingGroup.stories.push(story);
          if (hasUnviewed) existingGroup.hasUnviewed = true;
        } else {
          acc.push({
            user_id: story.user_id,
            user_email: story.user_email || "",
            user_name: story.user_name || story.user_email?.split("@")[0] || "User",
            stories: [story],
            hasUnviewed,
          });
        }
        return acc;
      }, []);

      // Sort: current user first, then those with unviewed stories
      grouped.sort((a, b) => {
        if (a.user_id === currentUserId) return -1;
        if (b.user_id === currentUserId) return 1;
        if (a.hasUnviewed && !b.hasUnviewed) return -1;
        if (!a.hasUnviewed && b.hasUnviewed) return 1;
        return 0;
      });

      setGroupedStories(grouped);
    } catch (error) {
      console.error("Error fetching stories:", error);
    }
  };

  // Fetch comments for a story
  const fetchComments = async (storyId: string) => {
    setLoadingComments(true);
    try {
      const { data, error } = await (supabase as any)
        .from("story_comments")
        .select("*")
        .eq("story_id", storyId)
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      setComments((data as StoryComment[]) || []);
    } catch (error) {
      console.error("Error fetching comments:", error);
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  // Add a comment
  const addComment = async () => {
    if (!newComment.trim() || !currentStory) return;
    
    try {
      const { error } = await (supabase as any).from("story_comments").insert({
        story_id: currentStory.id,
        user_id: currentUserId,
        user_email: currentUserEmail,
        user_name: currentUserName,
        comment: newComment.trim(),
      });
      
      if (error) throw error;
      
      setNewComment("");
      fetchComments(currentStory.id);
      toast.success("Komentar ditambahkan");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Gagal menambahkan komentar");
    }
  };

  const handleViewStory = async (groupIndex: number) => {
    setCurrentGroupIndex(groupIndex);
    setCurrentStoryIndex(0);
    setProgress(0);
    setViewDialogOpen(true);
    startProgressTimer();

    // Mark as viewed
    const story = groupedStories[groupIndex]?.stories[0];
    if (story) {
      fetchComments(story.id); // Fetch comments for this story
      if (!story.viewed_by?.includes(currentUserEmail)) {
        await supabase
          .from("stories")
          .update({
            viewed_by: [...(story.viewed_by || []), currentUserEmail],
            views_count: (story.views_count || 0) + 1,
          })
          .eq("id", story.id);
      }
    }
  };

  const startProgressTimer = () => {
    if (progressRef.current) clearInterval(progressRef.current);
    setProgress(0);
    
    progressRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          handleNextStory();
          return 0;
        }
        return prev + 2;
      });
    }, 100);
  };

  const handleNextStory = async () => {
    const currentGroup = groupedStories[currentGroupIndex];
    if (!currentGroup) return;

    if (currentStoryIndex < currentGroup.stories.length - 1) {
      const nextIndex = currentStoryIndex + 1;
      setCurrentStoryIndex(nextIndex);
      setProgress(0);
      
      // Mark next story as viewed
      const nextStory = currentGroup.stories[nextIndex];
      if (nextStory && !nextStory.viewed_by?.includes(currentUserEmail)) {
        await supabase
          .from("stories")
          .update({
            viewed_by: [...(nextStory.viewed_by || []), currentUserEmail],
            views_count: (nextStory.views_count || 0) + 1,
          })
          .eq("id", nextStory.id);
      }
    } else if (currentGroupIndex < groupedStories.length - 1) {
      setCurrentGroupIndex(prev => prev + 1);
      setCurrentStoryIndex(0);
      setProgress(0);
    } else {
      closeViewDialog();
    }
  };

  const handlePrevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
      setProgress(0);
    } else if (currentGroupIndex > 0) {
      const prevGroup = groupedStories[currentGroupIndex - 1];
      setCurrentGroupIndex(prev => prev - 1);
      setCurrentStoryIndex(prevGroup.stories.length - 1);
      setProgress(0);
    }
  };

  const closeViewDialog = () => {
    if (progressRef.current) clearInterval(progressRef.current);
    setViewDialogOpen(false);
    fetchStories();
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 1280 } }
      });
      setStream(mediaStream);
      setCameraOpen(true);
      
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(console.error);
        }
      }, 100);
    } catch (error) {
      console.error("Camera error:", error);
      toast.error("Tidak dapat mengakses kamera");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraOpen(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0);
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      // Compress camera capture to max 300KB
      const compressedBlob = await compressImage(blob);
      await uploadStory(compressedBlob);
      stopCamera();
    }, "image/jpeg", 0.9);
  };

  // Compress image to max 300KB
  const compressImage = async (file: Blob): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions to keep under 300KB
        const maxSize = 300 * 1024; // 300KB
        const originalSize = file.size;
        
        if (originalSize <= maxSize) {
          resolve(file);
          return;
        }
        
        // Scale down proportionally
        const scaleFactor = Math.sqrt(maxSize / originalSize);
        width = Math.floor(width * scaleFactor);
        height = Math.floor(height * scaleFactor);
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Try different quality settings to get under 300KB
        const tryCompress = (quality: number) => {
          canvas.toBlob(
            (blob) => {
              if (blob && blob.size <= maxSize) {
                resolve(blob);
              } else if (quality > 0.1) {
                tryCompress(quality - 0.1);
              } else {
                resolve(blob || file);
              }
            },
            "image/jpeg",
            quality
          );
        };
        
        tryCompress(0.8);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(file);
      };
      
      img.src = url;
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Pilih file gambar");
      return;
    }
    
    // Compress image before upload
    const compressedFile = await compressImage(file);
    await uploadStory(compressedFile);
  };

  const uploadStory = async (file: Blob) => {
    setUploading(true);
    try {
      const fileName = `story-${currentUserId}-${Date.now()}.jpg`;
      
      // Try to upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      let imageUrl: string;

      if (uploadError) {
        // Fallback to base64
        const reader = new FileReader();
        imageUrl = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from("avatars")
          .getPublicUrl(fileName);
        imageUrl = publicUrl;
      }

      // Insert story
      const { error } = await supabase.from("stories").insert({
        user_id: currentUserId,
        user_email: currentUserEmail,
        user_name: currentUserName,
        user_role: currentUserRole,
        image_url: imageUrl,
        caption: newCaption || null,
      });

      if (error) throw error;

      toast.success("Story berhasil dibuat!");
      setNewCaption("");
      setCreateDialogOpen(false);
      fetchStories();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Gagal membuat story");
    } finally {
      setUploading(false);
    }
  };

  const deleteStory = async (storyId: string) => {
    try {
      const { error } = await supabase.from("stories").delete().eq("id", storyId);
      if (error) throw error;
      toast.success("Story diarsipkan");
      closeViewDialog();
      fetchStories();
    } catch (error: any) {
      toast.error(error.message || "Gagal mengarsipkan story");
    }
  };

  const shareStory = async (story: Story) => {
    const shareData = {
      title: `Story dari ${story.user_name || "User"}`,
      text: story.caption || "Lihat story ini!",
      url: window.location.href,
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        toast.success("Story dibagikan!");
      } else {
        // Fallback: copy link to clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link story disalin ke clipboard!");
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        toast.error("Gagal membagikan story");
      }
    }
  };

  const openViewersDialog = () => {
    if (progressRef.current) clearInterval(progressRef.current);
    setViewersDialogOpen(true);
  };

  const closeViewersDialog = () => {
    setViewersDialogOpen(false);
    startProgressTimer();
  };

  const currentGroup = groupedStories[currentGroupIndex];
  const currentStory = currentGroup?.stories[currentStoryIndex];

  return (
    <div className="flex items-center gap-3 overflow-x-auto py-2 px-1">
      {/* Add Story Button */}
      <div className="flex flex-col items-center gap-1 flex-shrink-0">
        <span className="text-xs font-semibold text-white mb-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-yellow-300" />
          Let Him Cook
        </span>
        <button
          onClick={() => setCreateDialogOpen(true)}
          className="relative w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center hover:scale-105 transition-transform"
        >
          <Plus className="w-6 h-6 text-white" />
        </button>
        <span className="text-xs text-white/80">Tambah</span>
      </div>

      {/* Story Circles */}
      {groupedStories.map((group, index) => {
        // Get latest story caption for note display
        const latestStory = group.stories[0];
        const storyNote = latestStory?.caption;
        
        return (
          <div key={group.user_id} className="flex flex-col items-center gap-1 flex-shrink-0 relative">
            <button
              onClick={() => handleViewStory(index)}
              className={cn(
                "relative w-14 h-14 rounded-full p-0.5 hover:scale-105 transition-transform",
                group.hasUnviewed
                  ? "bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500"
                  : "bg-gray-400"
              )}
            >
              <Avatar className="w-full h-full border-2 border-white">
                <AvatarImage src={group.avatar} />
                <AvatarFallback className="bg-blue-500 text-white text-lg">
                  {group.user_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {group.user_id === currentUserId && group.stories.length > 0 && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                  <span className="text-[10px] text-white font-bold">{group.stories.length}</span>
                </div>
              )}
            </button>
            
            {/* Story Note/Caption Badge - Top Right */}
            {storyNote && (
              <div className="absolute -top-1 -right-1 max-w-[80px] bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[8px] px-1.5 py-0.5 rounded-full shadow-lg truncate z-10 border border-white/50">
                {storyNote.length > 12 ? storyNote.substring(0, 12) + "..." : storyNote}
              </div>
            )}
            
            <span className="text-xs text-white/80 truncate max-w-[60px]">
              {group.user_id === currentUserId ? "Anda" : group.user_name.split(" ")[0]}
            </span>
          </div>
        );
      })}

      {/* View Story Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={closeViewDialog}>
        <DialogContent className="max-w-md p-0 bg-black border-none overflow-hidden">
          {currentStory && currentGroup && (
            <div className="relative h-[80vh] min-h-[500px]">
              {/* Progress bars */}
              <div className="absolute top-2 left-2 right-2 flex gap-1 z-20">
                {currentGroup.stories.map((_, idx) => (
                  <div key={idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-100"
                      style={{
                        width: idx < currentStoryIndex ? "100%" : idx === currentStoryIndex ? `${progress}%` : "0%"
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Header */}
              <div className="absolute top-6 left-4 right-4 flex items-center justify-between z-20">
                <div className="flex items-center gap-2">
                  <Avatar className="w-8 h-8 border border-white">
                    <AvatarFallback className="bg-blue-500 text-white text-sm">
                      {currentGroup.user_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-white text-sm font-medium">{currentGroup.user_name}</p>
                    <p className="text-white/60 text-xs">
                      {new Date(currentStory.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {/* Share Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={() => shareStory(currentStory)}
                    title="Bagikan story"
                  >
                    <Share2 className="w-5 h-5" />
                  </Button>
                  {/* Archive Button - Only for own stories */}
                  {currentStory.user_id === currentUserId && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20 bg-amber-500/30"
                      onClick={() => deleteStory(currentStory.id)}
                      title="Arsipkan story"
                    >
                      <Archive className="w-5 h-5" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={closeViewDialog}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Story Image */}
              <img
                src={currentStory.image_url}
                alt="Story"
                className="w-full h-full object-contain"
              />


              {/* Navigation buttons */}
              <button
                className="absolute left-0 top-0 bottom-0 w-1/3 z-10"
                onClick={handlePrevStory}
              />
              <button
                className="absolute right-0 top-0 bottom-0 w-1/3 z-10"
                onClick={handleNextStory}
              />

              {/* Bottom section: Views count and Comments */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent z-20 p-4">
                {/* Caption above controls */}
                {currentStory.caption && (
                  <div className="mb-3">
                    <p className="text-white text-sm">{currentStory.caption}</p>
                  </div>
                )}
                
                {/* Comments and Views Row */}
                <div className="flex items-center justify-between gap-2">
                  {/* Left: Total views and Comment count */}
                  <div className="flex items-center gap-3">
                    {/* Views */}
                    {currentStory.user_id === currentUserId ? (
                      <button
                        onClick={openViewersDialog}
                        className="flex items-center gap-1 text-white hover:text-white/80 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="text-xs font-medium">{currentStory.views_count || 0}</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 text-white/70">
                        <Eye className="w-3 h-3" />
                        <span className="text-xs">{currentStory.views_count || 0}</span>
                      </div>
                    )}
                    
                    {/* Comments count button */}
                    <button
                      onClick={() => {
                        if (progressRef.current) clearInterval(progressRef.current);
                        setCommentsOpen(true);
                      }}
                      className="flex items-center gap-1 text-white hover:text-white/80 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span className="text-xs font-medium">{comments.length}</span>
                    </button>
                  </div>
                  
                  {/* Right: Comment input (small) */}
                  <div className="flex-1 max-w-[200px]">
                    <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1">
                      <input
                        type="text"
                        placeholder="Tulis komentar..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            addComment();
                          }
                        }}
                        onFocus={() => {
                          if (progressRef.current) clearInterval(progressRef.current);
                        }}
                        onBlur={() => {
                          startProgressTimer();
                        }}
                        className="flex-1 bg-transparent text-white text-xs placeholder:text-white/50 outline-none min-w-0"
                      />
                      <button
                        onClick={addComment}
                        disabled={!newComment.trim()}
                        className="text-white hover:text-blue-300 disabled:opacity-50"
                      >
                        <Send className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Viewers Dialog */}
      <Dialog open={viewersDialogOpen} onOpenChange={closeViewersDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Dilihat oleh ({currentStory?.views_count || 0})
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[300px]">
            {currentStory?.viewed_by && currentStory.viewed_by.length > 0 ? (
              <div className="space-y-2">
                {currentStory.viewed_by.map((viewer, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-blue-500 text-white text-sm">
                        {viewer.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm truncate flex-1">{viewer}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Eye className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Belum ada yang melihat story ini</p>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Create Story Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Buat Story Baru</DialogTitle>
          </DialogHeader>
          
          {cameraOpen ? (
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden bg-black aspect-[9/16] max-h-[400px]">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ transform: "scaleX(-1)" }}
                />
              </div>
              <div className="flex gap-2 justify-center">
                <Button onClick={capturePhoto} disabled={uploading}>
                  <Camera className="w-4 h-4 mr-2" />
                  Ambil Foto
                </Button>
                <Button variant="outline" onClick={stopCamera}>
                  Batal
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Input
                placeholder="Tambah caption (opsional)..."
                value={newCaption}
                onChange={(e) => setNewCaption(e.target.value)}
              />
              <div className="flex gap-2">
                <Button onClick={startCamera} className="flex-1" disabled={uploading}>
                  <Camera className="w-4 h-4 mr-2" />
                  Kamera
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Galeri
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Comments Dialog */}
      <Dialog open={commentsOpen} onOpenChange={(open) => {
        setCommentsOpen(open);
        if (!open) startProgressTimer();
      }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Komentar ({comments.length})
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[300px]">
            {loadingComments ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">Memuat komentar...</p>
              </div>
            ) : comments.length > 0 ? (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarFallback className="bg-blue-500 text-white text-sm">
                        {comment.user_name?.charAt(0).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{comment.user_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground break-words">{comment.comment}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Belum ada komentar</p>
                <p className="text-xs">Jadilah yang pertama berkomentar!</p>
              </div>
            )}
          </ScrollArea>
          <div className="flex items-center gap-2 pt-2 border-t">
            <Input
              placeholder="Tulis komentar..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addComment();
              }}
              className="flex-1"
            />
            <Button size="icon" onClick={addComment} disabled={!newComment.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}