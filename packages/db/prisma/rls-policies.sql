-- RLS Policies for Multi-tenancy
-- Run this after migrations

-- Function to get current tenant
CREATE OR REPLACE FUNCTION get_current_tenant_id() 
RETURNS UUID AS $$
BEGIN
  RETURN current_setting('app.tenant_id', true)::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- Tenants policies
CREATE POLICY IF NOT EXISTS tenant_isolation ON tenants
  USING (id = get_current_tenant_id());

-- Users policies  
CREATE POLICY IF NOT EXISTS users_tenant_isolation ON users
  USING (tenant_id = get_current_tenant_id());

-- Businesses policies
CREATE POLICY IF NOT EXISTS businesses_tenant_isolation ON businesses
  USING (tenant_id = get_current_tenant_id());

-- Services policies
CREATE POLICY IF NOT EXISTS services_tenant_isolation ON services
  USING (tenant_id = get_current_tenant_id());

-- Appointments policies
CREATE POLICY IF NOT EXISTS appointments_tenant_isolation ON appointments
  USING (tenant_id = get_current_tenant_id());

-- Customers policies
CREATE POLICY IF NOT EXISTS customers_tenant_isolation ON customers
  USING (tenant_id = get_current_tenant_id());

-- Reviews policies
CREATE POLICY IF NOT EXISTS reviews_tenant_isolation ON reviews
  USING (tenant_id = get_current_tenant_id());

-- Staff policies (through business relation)
CREATE POLICY IF NOT EXISTS staff_tenant_isolation ON staff
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE tenant_id = get_current_tenant_id()
    )
  );

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO PUBLIC;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO PUBLIC;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO PUBLIC;