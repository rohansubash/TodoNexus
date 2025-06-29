
-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('pending', 'in-progress', 'completed')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create task_shares table for sharing tasks between users
CREATE TABLE public.task_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  shared_by_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  shared_with_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  permission TEXT CHECK (permission IN ('view', 'edit')) DEFAULT 'view',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(task_id, shared_with_user_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_shares ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Tasks policies
CREATE POLICY "Users can view own tasks" ON public.tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view shared tasks" ON public.tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.task_shares
      WHERE task_shares.task_id = tasks.id
      AND task_shares.shared_with_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own tasks" ON public.tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON public.tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can update shared tasks with edit permission" ON public.tasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.task_shares
      WHERE task_shares.task_id = tasks.id
      AND task_shares.shared_with_user_id = auth.uid()
      AND task_shares.permission = 'edit'
    )
  );

CREATE POLICY "Users can delete own tasks" ON public.tasks
  FOR DELETE USING (auth.uid() = user_id);

-- Task shares policies
CREATE POLICY "Users can view task shares for their tasks" ON public.task_shares
  FOR SELECT USING (
    auth.uid() = shared_by_user_id OR auth.uid() = shared_with_user_id
  );

CREATE POLICY "Users can create shares for their own tasks" ON public.task_shares
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = task_shares.task_id
      AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete shares for their own tasks" ON public.task_shares
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = task_shares.task_id
      AND tasks.user_id = auth.uid()
    )
  );

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for tasks and task_shares
ALTER TABLE public.tasks REPLICA IDENTITY FULL;
ALTER TABLE public.task_shares REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_shares;
