CREATE TABLE suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  created_by UUID REFERENCES members(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE suggestion_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  suggestion_id UUID REFERENCES suggestions(id) ON DELETE CASCADE,
  author_id UUID REFERENCES members(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestion_comments ENABLE ROW LEVEL SECURITY;

-- Policies for suggestions
CREATE POLICY \
Everyone
can
view
suggestions\ ON suggestions FOR SELECT USING (true);
CREATE POLICY \Authenticated
users
can
insert
suggestions\ ON suggestions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY \Creators
can
update
their
suggestions\ ON suggestions FOR UPDATE USING (auth.uid() IN (SELECT profile_id FROM members WHERE id = created_by));
CREATE POLICY \Creators
can
delete
their
suggestions\ ON suggestions FOR DELETE USING (auth.uid() IN (SELECT profile_id FROM members WHERE id = created_by));

-- Policies for suggestion comments
CREATE POLICY \Everyone
can
view
suggestion
comments\ ON suggestion_comments FOR SELECT USING (true);
CREATE POLICY \Authenticated
users
can
insert
suggestion
comments\ ON suggestion_comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY \Authors
can
update
their
comments\ ON suggestion_comments FOR UPDATE USING (auth.uid() IN (SELECT profile_id FROM members WHERE id = author_id));
CREATE POLICY \Authors
can
delete
their
comments\ ON suggestion_comments FOR DELETE USING (auth.uid() IN (SELECT profile_id FROM members WHERE id = author_id));

