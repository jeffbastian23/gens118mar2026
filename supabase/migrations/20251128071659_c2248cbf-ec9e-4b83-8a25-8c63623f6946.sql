-- Create digital_footprint table for tracking work activities
CREATE TABLE IF NOT EXISTS public.digital_footprint (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('on', 'off')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  tasks TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create agenda table for meeting/event management
CREATE TABLE IF NOT EXISTS public.agenda (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  room_name TEXT NOT NULL,
  seating_arrangement TEXT,
  total_attendees INTEGER NOT NULL DEFAULT 0,
  consumption_needed INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.digital_footprint ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda ENABLE ROW LEVEL SECURITY;

-- RLS Policies for digital_footprint
CREATE POLICY "Users can view their own footprint" 
  ON public.digital_footprint 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own footprint" 
  ON public.digital_footprint 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own footprint" 
  ON public.digital_footprint 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own footprint" 
  ON public.digital_footprint 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS Policies for agenda
CREATE POLICY "Authenticated users can view agenda" 
  ON public.agenda 
  FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can create agenda" 
  ON public.agenda 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update agenda" 
  ON public.agenda 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Authenticated users can delete agenda" 
  ON public.agenda 
  FOR DELETE 
  USING (true);

-- Create triggers for updated_at
CREATE TRIGGER update_digital_footprint_updated_at
  BEFORE UPDATE ON public.digital_footprint
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agenda_updated_at
  BEFORE UPDATE ON public.agenda
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();