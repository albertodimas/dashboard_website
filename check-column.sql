-- Check if customSlug column exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'businesses' 
  AND column_name = 'customSlug';

-- Show current value
SELECT id, name, slug, "customSlug" 
FROM businesses 
WHERE slug = 'default-business';