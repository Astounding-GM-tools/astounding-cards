-- Rename portrait column to image
ALTER TABLE cards RENAME COLUMN portrait TO image;

-- Update any blob:local references
UPDATE cards SET image = NULL WHERE image = 'blob:local';

-- Update version in decks table
UPDATE decks SET version = 2; 