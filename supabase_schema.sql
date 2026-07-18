-- ==============================================================================
-- MAFIAPP: SUPABASE SCHEMA & RLS
-- ==============================================================================

-- 1. Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- FUNCIONES Y TRIGGERS GLOBALES
-- ==============================================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ==============================================================================
-- 2. HISTORIAL E INMUTABILIDAD (Auditoría)
-- ==============================================================================

CREATE TABLE history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'STATE_CHANGE')),
    old_data JSONB,
    new_data JSONB,
    performed_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Función genérica para registrar cambios en el historial
CREATE OR REPLACE FUNCTION log_history()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO history (table_name, record_id, action, new_data, performed_by)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW)::jsonb, auth.uid());
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO history (table_name, record_id, action, old_data, new_data, performed_by)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb, auth.uid());
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        -- No deberíamos borrar físicamente, pero lo cubrimos por si acaso
        INSERT INTO history (table_name, record_id, action, old_data, performed_by)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD)::jsonb, auth.uid());
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 3. USUARIOS Y PERFILES (auth.users -> profiles -> members)
-- ==============================================================================

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT
);
-- Roles iniciales
INSERT INTO roles (name, description) VALUES ('admin', 'Administrador'), ('member', 'Miembro normal');

-- Tabla de perfiles base (ligada a Supabase Auth)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER log_profiles_history AFTER INSERT OR UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION log_history();

-- Tabla de miembros (Datos de negocio de la peña)
CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    nickname TEXT NOT NULL,
    role_id UUID REFERENCES roles(id),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'banned')),
    join_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_members_modtime BEFORE UPDATE ON members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER log_members_history AFTER INSERT OR UPDATE ON members FOR EACH ROW EXECUTE FUNCTION log_history();

-- Trigger para crear profile cuando el Admin invita o crea auth.user
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- ==============================================================================
-- 4. INVENTARIO
-- ==============================================================================

CREATE TABLE inventory_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES inventory_categories(id),
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'borrowed', 'broken', 'lost', 'archived')),
    owner_id UUID REFERENCES members(id), -- A quién está prestado o quién lo custodia
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_inventory_modtime BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER log_inventory_history AFTER INSERT OR UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION log_history();

CREATE TABLE inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID REFERENCES inventory_items(id),
    previous_status TEXT,
    new_status TEXT,
    previous_owner_id UUID REFERENCES members(id),
    new_owner_id UUID REFERENCES members(id),
    notes TEXT,
    created_by UUID REFERENCES members(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 5. TAREAS
-- ==============================================================================

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    assignee_id UUID REFERENCES members(id), -- Un solo responsable
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'archived')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    due_date TIMESTAMPTZ,
    created_by UUID REFERENCES members(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_tasks_modtime BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER log_tasks_history AFTER INSERT OR UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION log_history();

CREATE TABLE task_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES tasks(id),
    author_id UUID REFERENCES members(id),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 6. FINANZAS
-- ==============================================================================

CREATE TABLE financial_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'compensation')),
    amount DECIMAL(12, 2) NOT NULL,
    concept TEXT NOT NULL,
    date TIMESTAMPTZ DEFAULT NOW(),
    member_id UUID REFERENCES members(id), -- Miembro relacionado con el pago/cobro
    created_by UUID REFERENCES members(id),
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_finances_modtime BEFORE UPDATE ON financial_movements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER log_finances_history AFTER INSERT OR UPDATE ON financial_movements FOR EACH ROW EXECUTE FUNCTION log_history();

CREATE TABLE financial_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    movement_id UUID REFERENCES financial_movements(id),
    file_url TEXT NOT NULL,
    uploaded_by UUID REFERENCES members(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 7. NOTIFICACIONES Y EMERGENCIAS
-- ==============================================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE emergency_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message TEXT NOT NULL,
    reported_by UUID REFERENCES members(id),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES members(id)
);

CREATE TRIGGER log_emergencies_history AFTER INSERT OR UPDATE ON emergency_alerts FOR EACH ROW EXECUTE FUNCTION log_history();

-- ==============================================================================
-- 8. POLÍTICAS RLS BÁSICAS (Row Level Security)
-- ==============================================================================

-- Habilitar RLS en tablas principales
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE history ENABLE ROW LEVEL SECURITY;

-- Profiles: Usuarios ven su propio perfil y el de los demás para el directorio
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Members: Visible para todos, modificable solo por admin o por ellos mismos
CREATE POLICY "Members are viewable by everyone" ON members FOR SELECT USING (true);

-- Finanzas: Transparencia total, todos ven, solo pueden insertar (pero no borrar)
CREATE POLICY "Finances viewable by everyone" ON financial_movements FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert finances" ON financial_movements FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Inventario: Todos lo ven
CREATE POLICY "Inventory viewable by everyone" ON inventory_items FOR SELECT USING (true);

-- Tareas: Todos ven
CREATE POLICY "Tasks viewable by everyone" ON tasks FOR SELECT USING (true);

-- History: Solo lectura para miembros, inmutable
CREATE POLICY "History is viewable by authenticated users" ON history FOR SELECT USING (auth.role() = 'authenticated');
