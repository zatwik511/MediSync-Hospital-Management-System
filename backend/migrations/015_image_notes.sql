-- Free-text clinical notes that radiologists and doctors can attach to an image.
ALTER TABLE medical_images
  ADD COLUMN IF NOT EXISTS notes TEXT;
