-- ================================================================
-- SCRIPT DE MIGRATION SUPABASE / POSTGRESQL POUR LGF'S STORE
-- Vendeur Principal: lgfmall.lmdg11@gmail.com
-- ================================================================

-- 1. IDENTIFICATION ET ALIGNEMENT DU VENDEUR PRINCIPAL
-- Mettre à jour ou insérer le vendeur principal dans la table des utilisateurs
-- (Adapté aux schémas standards PostgreSQL / Supabase)

DO $$
DECLARE
    v_vendor_id UUID;
BEGIN
    -- Récupération de l'ID utilisateur pour lgfmall.lmdg11@gmail.com
    SELECT id INTO v_vendor_id FROM users WHERE email = 'lgfmall.lmdg11@gmail.com' LIMIT 1;

    -- Si l'utilisateur n'existe pas, créer le compte vendeur officiel
    IF v_vendor_id IS NULL THEN
        INSERT INTO users (id, email, name, role, is_email_verified, phone, created_at, updated_at)
        VALUES (
            gen_random_uuid(),
            'lgfmall.lmdg11@gmail.com',
            'LGF''s Store',
            'VENDOR',
            true,
            '+228 72 99 81 48',
            NOW(),
            NOW()
        )
        RETURNING id INTO v_vendor_id;
    ELSE
        -- S'il existe déjà, s'assurer que le nom de la boutique est "LGF's Mall" et le rôle "VENDOR"
        UPDATE users
        SET name = 'LGF''s Mall',
            role = 'VENDOR',
            is_email_verified = true,
            updated_at = NOW()
        WHERE id = v_vendor_id;
    END IF;

    -- 2. MIGRATION & RATTACHEMENT DE TOUS LES ARTICLES D'ÉCHANTILLON/DÉMO
    -- Rattache formellement tous les produits orphelins ou mal attribués à LGF's Store
    UPDATE products
    SET vendor_id = v_vendor_id,
        updated_at = NOW()
    WHERE vendor_id IS NULL OR vendor_id != v_vendor_id;

    -- 3. PORTEFEUILLE SÉQUESTRE DE LA BOUTIQUE OFFICIELLE
    -- S'assurer que la boutique possède un portefeuille d'escrow actif
    INSERT INTO escrow_wallets (id, vendor_id, balance, pending_balance, currency, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        v_vendor_id,
        2500000.0,
        0.0,
        'XOF',
        NOW(),
        NOW()
    )
    ON CONFLICT (vendor_id) DO UPDATE
    SET balance = GREATEST(escrow_wallets.balance, 2500000.0),
        updated_at = NOW();

    -- 4. VALIDATION ET CONFIRMATION DANS LES LOGS
    RAISE NOTICE '✅ Migration terminée avec succès pour LGF''s Store (ID: %)', v_vendor_id;
END $$;

-- ================================================================
-- REQUÊTE PRISMA COMPATIBLE (Si table en PascalCase dans PostgreSQL)
-- ================================================================
/*
UPDATE "User"
SET "name" = 'LGF''s Store', "role" = 'VENDOR'
WHERE "email" = 'lgfmall.lmdg11@gmail.com';

UPDATE "Product"
SET "vendorId" = (SELECT "id" FROM "User" WHERE "email" = 'lgfmall.lmdg11@gmail.com' LIMIT 1);
*/
