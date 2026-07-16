-- ============================================================
-- Migration 003: Update Card Stats System
-- Replace old stats with new thematic ones
-- ============================================================

-- Rename old stat columns to new ones
ALTER TABLE cards
  RENAME COLUMN stat_fluffiness TO stat_alter;

ALTER TABLE cards
  RENAME COLUMN stat_patina TO stat_flecken;

ALTER TABLE cards
  RENAME COLUMN stat_size TO stat_witterung;

ALTER TABLE cards
  RENAME COLUMN stat_findability TO stat_geruch;

ALTER TABLE cards
  RENAME COLUMN stat_prestige TO stat_kontaminierung;

-- Add optional comment/notes field
ALTER TABLE cards
  ADD COLUMN notes TEXT DEFAULT '';

-- Update comments on columns for clarity
COMMENT ON COLUMN cards.stat_alter IS 'Alter der Matratze (0-100)';
COMMENT ON COLUMN cards.stat_flecken IS 'Menge/Intensität von Flecken (0-100)';
COMMENT ON COLUMN cards.stat_witterung IS 'UV-Schäden, Verwitterung, Verformung (0-100)';
COMMENT ON COLUMN cards.stat_geruch IS 'Muffigkeit, Geruchsintensität (0-100)';
COMMENT ON COLUMN cards.stat_kontaminierung IS 'Hygiene-Risiko / Kontaminierung (0-100)';
COMMENT ON COLUMN cards.notes IS 'Optionale Notizen/Kommentare zur Karte';
