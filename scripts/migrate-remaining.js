const { Client } = require('pg');

async function migrateRemaining() {
  const connectionString = process.env.DATABASE_URL;
  const client = new Client({
    connectionString,
    ssl: connectionString && !connectionString.includes('localhost') ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log("Connected to Neon database for remaining migrations.");

    // 1. hospital_requirement table
    console.log("Creating 'hospital_requirement' table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS hospital_requirement (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        application_no VARCHAR(50) UNIQUE NOT NULL,
        candidate_name VARCHAR(150) NOT NULL,
        email VARCHAR(150) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        gender VARCHAR(20),
        target_state VARCHAR(100),
        qualification VARCHAR(200),
        target_hospital VARCHAR(200),
        department VARCHAR(200),
        madhyamik_marks VARCHAR(50),
        hs_marks VARCHAR(50),
        status VARCHAR(30) DEFAULT 'pending',
        payment_status VARCHAR(30) DEFAULT 'unpaid',
        application_fee NUMERIC(10,2) DEFAULT 1500.00,
        paid_amount NUMERIC(10,2) DEFAULT 0.00,
        payment_method VARCHAR(50),
        transaction_id VARCHAR(100),
        payment_receipt TEXT,
        cv_attach TEXT,
        template_header VARCHAR(255) DEFAULT 'MSJ Global Education • Official Hospital Consultation & Placement Application',
        template_footer VARCHAR(255) DEFAULT 'Certified by MSJ Clinical Coordination Board • 100% Verified Hospital Placement & Training Assistance',
        form_data JSONB DEFAULT '{}',
        coordinator_notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_hosp_status ON hospital_requirement (status);
      CREATE INDEX IF NOT EXISTS idx_hosp_payment ON hospital_requirement (payment_status);
      CREATE INDEX IF NOT EXISTS idx_hosp_created ON hospital_requirement (created_at DESC);
    `);
    console.log("Table 'hospital_requirement' created successfully!");

    // 2. site_settings and email_settings
    console.log("Creating settings tables...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS site_settings (
        id INT PRIMARY KEY DEFAULT 1,
        site_name VARCHAR(255) NOT NULL DEFAULT 'MSJ Global Education Consultancy',
        site_tagline VARCHAR(255) NOT NULL DEFAULT 'Your Gateway to Global Education',
        contact_email VARCHAR(255) NOT NULL DEFAULT 'msjglobaleducationconsultancy@gmail.com',
        contact_phone VARCHAR(50) NOT NULL DEFAULT '+91 9635953116',
        address TEXT NOT NULL DEFAULT 'Kolkata, West Bengal, India',
        timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata',
        maintenance_mode BOOLEAN NOT NULL DEFAULT false,
        site_icon_url TEXT,
        favicon_url TEXT,
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT single_row_site CHECK (id = 1)
      );

      INSERT INTO site_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

      CREATE TABLE IF NOT EXISTS email_settings (
        id INT PRIMARY KEY DEFAULT 1,
        smtp_host VARCHAR(255) NOT NULL DEFAULT 'smtp.gmail.com',
        smtp_port VARCHAR(10) NOT NULL DEFAULT '587',
        smtp_user VARCHAR(255) NOT NULL DEFAULT 'noreply@msjglobal.edu',
        smtp_password VARCHAR(255) NOT NULL DEFAULT '',
        from_name VARCHAR(255) NOT NULL DEFAULT 'MSJ Global Education',
        from_email VARCHAR(255) NOT NULL DEFAULT 'noreply@msjglobal.edu',
        encryption VARCHAR(10) NOT NULL DEFAULT 'TLS',
        email_enabled BOOLEAN NOT NULL DEFAULT true,
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT single_row_email CHECK (id = 1)
      );

      INSERT INTO email_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
    `);
    console.log("Settings tables created and seeded successfully!");

    await client.end();
  } catch (err) {
    console.error("Migration error:", err);
    await client.end().catch(() => {});
    process.exit(1);
  }
}

migrateRemaining();
