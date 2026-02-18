
-- B.LABAN EMS - MASTER SEED DATA
-- This script populates the database with a full testing environment.

BEGIN;

-------------------------------------------------------
-- 1. AUTH USERS (Fixed UUIDs for Login)
-------------------------------------------------------
-- Admin: admin@blaban.eg / password
-- Manager: manager@blaban.eg / password
-- Tech 1: tech.alex@blaban.eg / password
-- Tech 2: tech.cairo@blaban.eg / password

INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
VALUES 
  ('d0d6d566-1015-4001-a068-000000000001', 'admin@blaban.eg', '$2a$10$wT.f.0.0.0.0.0.0.0.0.0', now(), '{"provider": "email", "providers": ["email"]}', '{}', now(), now(), 'authenticated', 'authenticated'),
  ('d0d6d566-1015-4001-a068-000000000002', 'manager@blaban.eg', '$2a$10$wT.f.0.0.0.0.0.0.0.0.0', now(), '{"provider": "email", "providers": ["email"]}', '{}', now(), now(), 'authenticated', 'authenticated'),
  ('d0d6d566-1015-4001-a068-000000000003', 'tech.alex@blaban.eg', '$2a$10$wT.f.0.0.0.0.0.0.0.0.0', now(), '{"provider": "email", "providers": ["email"]}', '{}', now(), now(), 'authenticated', 'authenticated'),
  ('d0d6d566-1015-4001-a068-000000000004', 'tech.cairo@blaban.eg', '$2a$10$wT.f.0.0.0.0.0.0.0.0.0', now(), '{"provider": "email", "providers": ["email"]}', '{}', now(), now(), 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;

-------------------------------------------------------
-- 2. ORGANIZATION HIERARCHY
-------------------------------------------------------
INSERT INTO brands (name) VALUES ('B.Laban') ON CONFLICT DO NOTHING;

DO $$
DECLARE
    brand_id UUID;
    sec_cairo UUID; sec_alex UUID; sec_delta UUID;
    area_nasr UUID; area_maadi UUID; area_zayed UUID; area_smoha UUID; area_agami UUID; area_tanta UUID;
BEGIN
    SELECT id INTO brand_id FROM brands WHERE name = 'B.Laban' LIMIT 1;

    -- Sectors
    INSERT INTO sectors (name, brand_id) VALUES 
        ('قطاع القاهرة الكبرى', brand_id),
        ('قطاع الإسكندرية', brand_id),
        ('قطاع الدلتا', brand_id)
    ON CONFLICT DO NOTHING;

    SELECT id INTO sec_cairo FROM sectors WHERE name = 'قطاع القاهرة الكبرى';
    SELECT id INTO sec_alex FROM sectors WHERE name = 'قطاع الإسكندرية';
    SELECT id INTO sec_delta FROM sectors WHERE name = 'قطاع الدلتا';

    -- Areas
    INSERT INTO areas (name, sector_id) VALUES 
        ('مدينة نصر', sec_cairo), ('المعادي', sec_cairo), ('الشيخ زايد', sec_cairo),
        ('سموحة', sec_alex), ('العجمي', sec_alex),
        ('طنطا', sec_delta)
    ON CONFLICT DO NOTHING;

    SELECT id INTO area_nasr FROM areas WHERE name = 'مدينة نصر';
    SELECT id INTO area_maadi FROM areas WHERE name = 'المعادي';
    SELECT id INTO area_zayed FROM areas WHERE name = 'الشيخ زايد';
    SELECT id INTO area_smoha FROM areas WHERE name = 'سموحة';
    SELECT id INTO area_agami FROM areas WHERE name = 'العجمي';
    SELECT id INTO area_tanta FROM areas WHERE name = 'طنطا';

    -- Branches (Real Locations)
    INSERT INTO branches (name, area_id, location_lat, location_lng) VALUES 
        ('فرع عباس العقاد', area_nasr, 30.0609, 31.3302),
        ('فرع شارع 9', area_maadi, 29.9590, 31.2600),
        ('فرع هايبر وان', area_zayed, 30.0710, 30.9500),
        ('فرع دوران سموحة', area_smoha, 31.2156, 29.9536),
        ('فرع البيطاش', area_agami, 31.1500, 29.8000),
        ('فرع الاستاد', area_tanta, 30.7865, 31.0004)
    ON CONFLICT DO NOTHING;
END $$;

-------------------------------------------------------
-- 3. PROFILES (Linked to Branches)
-------------------------------------------------------
INSERT INTO profiles (id, full_name, role, phone, branch_id, is_active)
VALUES 
    ('d0d6d566-1015-4001-a068-000000000001', 'مدير النظام (Admin)', 'ADMIN', '01000000000', NULL, true),
    ('d0d6d566-1015-4001-a068-000000000002', 'أحمد يونس (Manager)', 'MANAGER', '01200000000', (SELECT id FROM branches WHERE name = 'فرع عباس العقاد' LIMIT 1), true),
    ('d0d6d566-1015-4001-a068-000000000003', 'إبراهيم فني (Alex)', 'TECHNICIAN', '01100000000', (SELECT id FROM branches WHERE name = 'فرع دوران سموحة' LIMIT 1), true),
    ('d0d6d566-1015-4001-a068-000000000004', 'محمود فني (Cairo)', 'TECHNICIAN', '01500000000', (SELECT id FROM branches WHERE name = 'فرع عباس العقاد' LIMIT 1), true)
ON CONFLICT (id) DO NOTHING;

-------------------------------------------------------
-- 4. ASSETS (The Equipment)
-------------------------------------------------------
-- Using a temporary variable block to simplify inserts
DO $$
DECLARE
    br_abbas UUID; br_maadi UUID; br_smoha UUID; br_tanta UUID;
BEGIN
    SELECT id INTO br_abbas FROM branches WHERE name = 'فرع عباس العقاد';
    SELECT id INTO br_maadi FROM branches WHERE name = 'فرع شارع 9';
    SELECT id INTO br_smoha FROM branches WHERE name = 'فرع دوران سموحة';
    SELECT id INTO br_tanta FROM branches WHERE name = 'فرع الاستاد';

    INSERT INTO maintenance_assets (name, serial_number, category, status, branch_id, initial_value, location, health_score, supplier, supplier_contact, image_url)
    VALUES
    -- Cairo Assets
    ('ماكينة آيس كريم سوفت (Carpigiani)', 'CP-2023-X99', 'آيس كريم', 'ACTIVE', br_abbas, 120000, 'الكونتر الأمامي', 92, 'إيجيبت تكنو', '01012345678', 'https://images.unsplash.com/photo-1560786938-1e42d5fa4d60?auto=format&fit=crop&q=80&w=300'),
    ('ثلاجة عرض حلويات (بانوراما)', 'REF-PAN-01', 'تبريد', 'ACTIVE', br_abbas, 45000, 'صالة العرض', 85, 'المصرية للتبريد', '01112223334', 'https://images.unsplash.com/photo-1571175443880-49e1d58b794a?auto=format&fit=crop&q=80&w=300'),
    ('فرن تسوية (Rational)', 'OVEN-RT-55', 'أفران', 'MAINTENANCE', br_maadi, 85000, 'المطبخ الساخن', 60, 'الشيف للتجهيزات', '01223334445', 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&q=80&w=300'),
    
    -- Alex Assets
    ('خلاط صناعي 100 لتر (للأرز باللبن)', 'MIX-BIG-02', 'معدات تحضير', 'ACTIVE', br_smoha, 32000, 'منطقة التحضير', 95, 'السلام ستيل', '01556667778', 'https://images.unsplash.com/photo-1585837575652-2c6bf89e248a?auto=format&fit=crop&q=80&w=300'),
    ('تكييف مركزي (Carrier 5hp)', 'AC-CAR-22', 'تكييف', 'BROKEN', br_smoha, 55000, 'السطح', 30, 'ميراكو كاريير', '19111', 'https://images.unsplash.com/photo-1616763355548-1b606f439f86?auto=format&fit=crop&q=80&w=300'),
    
    -- Delta Assets
    ('ماكينة تغليف حراري (Packaging)', 'PKG-AUTO-88', 'تغليف', 'ACTIVE', br_tanta, 18000, 'منطقة الديليفري', 88, 'باك تك', '01009998887', 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=300'),
    ('نظام كاشير (Touch Screen)', 'POS-NCR-01', 'إلكترونيات', 'ACTIVE', br_tanta, 15000, 'الكاشير', 98, 'ديجيتال سيستمز', '01222222222', 'https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?auto=format&fit=crop&q=80&w=300')
    ON CONFLICT DO NOTHING;
END $$;

-------------------------------------------------------
-- 5. SPARE PARTS (Inventory)
-------------------------------------------------------
INSERT INTO spare_parts (name, category, current_stock, min_stock_level, price, image_url)
VALUES
    ('كومبريسور دانفوس 1.5 حصان', 'تبريد', 2, 3, 4500, 'https://images.unsplash.com/photo-1581092921461-eab6245b0262?auto=format&fit=crop&q=80&w=200'),
    ('سير نقل حركة (خلاط)', 'قطع ميكانيكية', 15, 5, 120, 'https://images.unsplash.com/photo-1580913428739-9e32057d38e6?auto=format&fit=crop&q=80&w=200'),
    ('حساس حرارة ديجيتال', 'إلكترونيات', 25, 10, 350, 'https://images.unsplash.com/photo-1555664424-778a69022365?auto=format&fit=crop&q=80&w=200'),
    ('مقبض باب ثلاجة ستانلس', 'اكسسوارات', 8, 4, 150, 'https://images.unsplash.com/photo-1533038590840-1cde6e668a97?auto=format&fit=crop&q=80&w=200'),
    ('غاز فريون R404 (اسطوانة)', 'تبريد', 5, 2, 2800, 'https://images.unsplash.com/photo-1624823183492-411a5d62547b?auto=format&fit=crop&q=80&w=200'),
    ('شاشة تحكم فرن (Board)', 'إلكترونيات', 1, 1, 5500, 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=200')
ON CONFLICT DO NOTHING;

-------------------------------------------------------
-- 6. TICKETS (Work Orders)
-------------------------------------------------------
DO $$
DECLARE
    asset_fridge UUID; asset_oven UUID; asset_ac UUID; asset_mixer UUID;
    tech_cairo UUID; tech_alex UUID;
BEGIN
    SELECT id INTO asset_fridge FROM maintenance_assets WHERE name LIKE '%بانوراما%' LIMIT 1;
    SELECT id INTO asset_oven FROM maintenance_assets WHERE name LIKE '%Rational%' LIMIT 1;
    SELECT id INTO asset_ac FROM maintenance_assets WHERE name LIKE '%تكييف%' LIMIT 1;
    SELECT id INTO asset_mixer FROM maintenance_assets WHERE name LIKE '%خلاط%' LIMIT 1;
    
    tech_cairo := 'd0d6d566-1015-4001-a068-000000000004';
    tech_alex := 'd0d6d566-1015-4001-a068-000000000003';

    INSERT INTO tickets (title, description, asset_id, status, priority, technician_id, created_at, closed_at, diagnosis)
    VALUES
    -- Open / New
    ('صوت عالي في الكومبريسور', 'الثلاجة تصدر صوت عالي جداً والحرارة بدأت ترتفع.', asset_fridge, 'OPEN', 'HIGH', NULL, NOW() - INTERVAL '4 hours', NULL, NULL),
    
    -- In Progress
    ('الفرن لا يصل للحرارة المطلوبة', 'الفرن يفصل عند 150 درجة والمطلوب 200.', asset_oven, 'IN_PROGRESS', 'MEDIUM', tech_cairo, NOW() - INTERVAL '1 day', NULL, 'اشتباه في عطل حساس الحرارة'),
    
    -- Pending Parts
    ('توقف التكييف تماماً', 'الوحدة الخارجية لا تعمل.', asset_ac, 'PENDING_PARTS', 'CRITICAL', tech_alex, NOW() - INTERVAL '2 days', NULL, 'يحتاج تغيير كباستور ومروحة'),
    
    -- Closed (History)
    ('صيانة دورية للخلاط', 'تشحيم التروس وتغيير السيور.', asset_mixer, 'CLOSED', 'LOW', tech_alex, NOW() - INTERVAL '1 month', NOW() - INTERVAL '29 days', 'تمت الصيانة بنجاح')
    ON CONFLICT DO NOTHING;
END $$;

-------------------------------------------------------
-- 7. SYSTEM CONFIG (Default Settings)
-------------------------------------------------------
INSERT INTO system_config (key, value)
VALUES 
    ('list_asset_categories', '["تبريد", "أفران", "معدات تحضير", "تغليف", "آيس كريم", "تكييف", "إلكترونيات", "أثاث"]'),
    ('list_part_categories', '["تبريد", "قطع ميكانيكية", "إلكترونيات", "اكسسوارات", "زيوت وشحوم"]'),
    ('maintenanceMode', 'false'),
    ('enableAIAnalysis', 'true')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

COMMIT;
