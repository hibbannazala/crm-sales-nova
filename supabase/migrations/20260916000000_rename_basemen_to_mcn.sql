-- Rename 'Basemen' product values to 'MCN' across all relevant tables

-- 1. Update product_offered array in leads table
UPDATE leads 
SET product_offered = array_replace(product_offered, 'Basemen', 'MCN') 
WHERE 'Basemen' = ANY(product_offered);

-- 2. Update product in oi_forecasts table
UPDATE oi_forecasts 
SET product = 'MCN' 
WHERE product = 'Basemen';

-- 3. Update product in oi_targets table
UPDATE oi_targets 
SET product = 'MCN' 
WHERE product = 'Basemen';
