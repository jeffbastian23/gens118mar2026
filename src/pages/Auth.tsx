import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import customsBuildingBg from "@/assets/customs-building-bg.png";
import logoKemenkeu from "@/assets/logo-kemenkeu.png";
import logoCustoms from "@/assets/logo-customs.png";
import { PaktaIntegritasDialog } from "@/components/PaktaIntegritasDialog";
import { playGensiSound } from "@/utils/loginSoundEffect";

interface QuoteItem {
  id: string;
  quote_text: string;
  is_active: boolean;
  display_order: number | null;
}

interface QuoteSettings {
  auto_mode: boolean;
  rotation_interval_seconds: number;
}

interface BackgroundItem {
  id: string;
  name: string;
  image_url: string;
  is_active: boolean;
}

const emailSchema = z.string().email().refine(
  (email) => email.endsWith("@kemenkeu.go.id"),
  { message: "Email harus menggunakan domain @kemenkeu.go.id" }
);

const passwordSchema = z.string().min(8, { message: "Password minimal 8 karakter" });

export default function Auth() {
  const navigate = useNavigate();
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPaktaIntegritas, setShowPaktaIntegritas] = useState(false);
  
  // Quote state
  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [quoteSettings, setQuoteSettings] = useState<QuoteSettings | null>(null);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [currentQuote, setCurrentQuote] = useState("One for all, a trusted voice in every decision");
  
  // Background state
  const [backgroundUrl, setBackgroundUrl] = useState<string>(customsBuildingBg);

  // Fetch quotes, settings, and active background
  const fetchQuotesAndSettings = useCallback(async () => {
    try {
      const [quotesRes, settingsRes, backgroundRes] = await Promise.all([
        supabase.from("quotes").select("*").eq("is_active", true).order("display_order", { ascending: true }),
        supabase.from("quote_settings").select("*").limit(1).single(),
        (supabase as any).from("login_backgrounds").select("*").eq("is_active", true).limit(1).single()
      ]);

      if (quotesRes.data && quotesRes.data.length > 0) {
        setQuotes(quotesRes.data);
        setCurrentQuote(quotesRes.data[0].quote_text);
      }
      
      if (settingsRes.data) {
        setQuoteSettings(settingsRes.data);
      }
      
      if (backgroundRes.data) {
        const bg = backgroundRes.data as BackgroundItem;
        // Only use the URL if it's a valid URL (starts with http or /)
        if (bg.image_url && (bg.image_url.startsWith('http') || bg.image_url.startsWith('/'))) {
          setBackgroundUrl(bg.image_url);
        }
      }
    } catch (error) {
      console.error("Error fetching quotes/background:", error);
    }
  }, []);

  useEffect(() => {
    fetchQuotesAndSettings();
  }, [fetchQuotesAndSettings]);

  // Auto-rotate quotes in FIFO mode
  useEffect(() => {
    if (!quoteSettings?.auto_mode || quotes.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentQuoteIndex((prev) => {
        const nextIndex = (prev + 1) % quotes.length;
        setCurrentQuote(quotes[nextIndex].quote_text);
        return nextIndex;
      });
    }, (quoteSettings.rotation_interval_seconds || 10) * 1000);

    return () => clearInterval(interval);
  }, [quoteSettings, quotes]);
  useEffect(() => {
    // Check recovery mode FIRST from URL
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const isRecovery = hashParams.get("type") === "recovery" || 
                       hashParams.get("access_token") !== null;
    
    if (isRecovery) {
      setIsPasswordRecovery(true);
      setIsForgotPassword(false);
      return; // Don't redirect if in recovery mode
    }

    // Then check session for redirect
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && !isPasswordRecovery) {
        navigate("/");
      }
    };
    checkAuth();
  }, [navigate, isPasswordRecovery]);

  // Detect password recovery mode from auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "PASSWORD_RECOVERY") {
          setIsPasswordRecovery(true);
          setIsForgotPassword(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handlePaktaAccept = () => {
    setShowPaktaIntegritas(false);
    navigate("/");
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate password
      const passwordValidation = passwordSchema.safeParse(newPassword);
      if (!passwordValidation.success) {
        toast.error(passwordValidation.error.errors[0].message);
        setLoading(false);
        return;
      }

      // Check if passwords match
      if (newPassword !== confirmPassword) {
        toast.error("Password tidak sama");
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Password berhasil diubah!");
        navigate("/");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate email
      const emailValidation = emailSchema.safeParse(email);
      if (!emailValidation.success) {
        toast.error(emailValidation.error.errors[0].message);
        setLoading(false);
        return;
      }

      if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });

        if (error) {
          toast.error(error.message);
        } else {
          toast.success("Link reset password telah dikirim ke email Anda!");
          setIsForgotPassword(false);
          setEmail("");
        }
        setLoading(false);
        return;
      }

      // Validate password
      const passwordValidation = passwordSchema.safeParse(password);
      if (!passwordValidation.success) {
        toast.error(passwordValidation.error.errors[0].message);
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Email atau password salah");
        } else {
          toast.error(error.message);
        }
      } else {
        // Play the Gensi notification sound on successful login
        playGensiSound();
        toast.success("Berhasil masuk!");
        setShowPaktaIntegritas(true);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: `url(${backgroundUrl})` }}
    >
      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-black/20"></div>
      
      <Card className="w-full max-w-lg relative z-10 shadow-2xl backdrop-blur-sm bg-white/95">
        <CardHeader className="space-y-1 px-4 sm:px-6">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <img 
              src={logoKemenkeu} 
              alt="Logo Kementerian Keuangan" 
              className="h-12 sm:h-16 md:h-20"
            />
            <img 
              src={logoCustoms} 
              alt="Logo Customs" 
              className="h-10 sm:h-12 md:h-16"
            />
          </div>
          <CardTitle className="text-lg sm:text-xl md:text-2xl text-center font-semibold">
            {isPasswordRecovery 
              ? "Buat Password Baru" 
              : isForgotPassword 
                ? "Lupa Password" 
                : "Gensi V.01"}
          </CardTitle>
          <CardDescription className="text-center text-sm sm:text-base">
            {isPasswordRecovery
              ? "Masukkan password baru Anda"
              : isForgotPassword
                ? "Masukkan email Anda untuk reset password"
                : "Masukkan email dan password Anda"}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          {isPasswordRecovery ? (
            <form onSubmit={handleUpdatePassword} className="space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm sm:text-base">Password Baru</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Minimal 8 karakter"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="text-sm sm:text-base h-10 sm:h-11 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setShowNewPassword((v) => !v)}
                    aria-label={showNewPassword ? "Sembunyikan password" : "Tampilkan password"}
                    disabled={loading}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm sm:text-base">Konfirmasi Password Baru</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Ulangi password baru"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="text-sm sm:text-base h-10 sm:h-11 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label={showConfirmPassword ? "Sembunyikan password" : "Tampilkan password"}
                    disabled={loading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full text-sm sm:text-base h-10 sm:h-11" 
                disabled={loading}
              >
                {loading ? "Memproses..." : "Update Password"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleAuth} className="space-y-3 sm:space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm sm:text-base">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@kemenkeu.go.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="text-sm sm:text-base h-10 sm:h-11"
              />
            </div>
            {!isForgotPassword && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm sm:text-base">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimal 8 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="text-sm sm:text-base h-10 sm:h-11 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
            )}
            <Button 
              type="submit" 
              className="w-full text-sm sm:text-base h-10 sm:h-11" 
              disabled={loading}
            >
              {loading ? "Memproses..." : isForgotPassword ? "Kirim Link Reset" : "Masuk"}
            </Button>
          </form>
          )}
          <div className="mt-3 sm:mt-4 text-center text-sm sm:text-base space-y-2">
            {!isForgotPassword && (
              <button
                type="button"
                onClick={() => setIsForgotPassword(true)}
                className="text-primary hover:underline block w-full"
                disabled={loading}
              >
                Lupa password?
              </button>
            )}
            {isForgotPassword && (
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setEmail("");
                }}
                className="text-primary hover:underline block w-full"
                disabled={loading}
              >
                Kembali ke halaman login
              </button>
            )}
          </div>
          
          {/* Quote */}
          <p className="mt-4 text-center text-sm text-muted-foreground italic font-serif transition-opacity duration-500">
            "{currentQuote}"
          </p>
        </CardContent>
      </Card>

      <PaktaIntegritasDialog 
        open={showPaktaIntegritas} 
        onAccept={handlePaktaAccept} 
      />
    </div>
  );
}
