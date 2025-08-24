-- Hash for password: Manager1+
UPDATE users SET "passwordHash" = '$2a$10$ZKJhRQ8VdRnYm1VhGCVqJOhKhgKxVzQTQQdJ8xR7/eMjLuWPqLgbu' WHERE email = 'walny.mc@gmail.com';

-- Check if user has a tenant
DO $$
DECLARE
  v_user_id UUID;
  v_tenant_id UUID;
  v_business_id UUID;
BEGIN
  -- Get user ID
  SELECT id, "tenantId" INTO v_user_id, v_tenant_id FROM users WHERE email = 'walny.mc@gmail.com';
  
  IF v_tenant_id IS NULL THEN
    -- Create tenant
    INSERT INTO tenants (name, subdomain, email, plan, settings)
    VALUES ('Walny Business', 'walny-business', 'walny.mc@gmail.com', 'PRO', '{}')
    RETURNING id INTO v_tenant_id;
    
    -- Update user with tenant
    UPDATE users SET "tenantId" = v_tenant_id WHERE id = v_user_id;
  END IF;
  
  -- Check if user has any business
  IF NOT EXISTS (SELECT 1 FROM memberships WHERE "userId" = v_user_id) THEN
    -- Create business
    INSERT INTO businesses (
      "tenantId", name, slug, description, phone, email,
      address, city, state, "postalCode", country, timezone,
      currency, settings, "isActive"
    )
    VALUES (
      v_tenant_id, 'Walny Business', 'walny-business', 'Your business description',
      '1234567890', 'walny.mc@gmail.com', '123 Main St', 'Your City', 'YS',
      '12345', 'US', 'America/New_York', 'USD',
      '{"bookingEnabled": true, "requireApproval": false, "autoConfirm": true}',
      true
    )
    RETURNING id INTO v_business_id;
    
    -- Create membership
    INSERT INTO memberships ("userId", "businessId", role)
    VALUES (v_user_id, v_business_id, 'OWNER');
  END IF;
END $$;