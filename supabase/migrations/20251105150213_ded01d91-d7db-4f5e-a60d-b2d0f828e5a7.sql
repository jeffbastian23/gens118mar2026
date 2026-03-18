-- Create news table
CREATE TABLE IF NOT EXISTS public.news (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  source TEXT DEFAULT 'Kemenkeu',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

-- Create policies for news
CREATE POLICY "Anyone can view active news" 
ON public.news 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can insert news" 
ON public.news 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Admins can update news" 
ON public.news 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete news" 
ON public.news 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_news_updated_at
BEFORE UPDATE ON public.news
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial news from Kemenkeu
INSERT INTO public.news (title, url, published_at, source) VALUES
('Kementerian Keuangan meluncurkan program digitalisasi layanan publik 2024', 'https://www.kemenkeu.go.id', now(), 'Kemenkeu'),
('DJBC Jawa Timur I raih penghargaan terbaik pelayanan publik', 'https://www.kemenkeu.go.id', now(), 'Kemenkeu'),
('Sosialisasi kebijakan baru terkait administrasi kepegawaian', 'https://www.kemenkeu.go.id', now(), 'Kemenkeu'),
('Peningkatan kompetensi SDM melalui pelatihan dan sertifikasi', 'https://www.kemenkeu.go.id', now(), 'Kemenkeu'),
('Implementasi sistem e-Government untuk efisiensi kerja', 'https://www.kemenkeu.go.id', now(), 'Kemenkeu');