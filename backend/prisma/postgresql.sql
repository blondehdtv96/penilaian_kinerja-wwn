-- ================================================================
-- PostgreSQL DDL for VoO / Ide Kaizen Platform
-- For reference / production deployment
-- ================================================================

-- Roles
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    nip VARCHAR(50) UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    role_id INT NOT NULL REFERENCES roles(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Operators
CREATE TABLE operators (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    section VARCHAR(100) DEFAULT '',
    line VARCHAR(100) DEFAULT '',
    "group" VARCHAR(100) DEFAULT '',
    position VARCHAR(100) DEFAULT 'Operator',
    photo TEXT,
    qr_code TEXT UNIQUE NOT NULL,
    performance_score FLOAT DEFAULT 0,
    total_merit INT DEFAULT 0,
    total_misconduct INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- QR Locations
CREATE TABLE qr_locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    area VARCHAR(100) NOT NULL,
    description TEXT,
    qr_image TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- QR Scan Logs
CREATE TABLE qr_scan_logs (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id),
    qr_location_id INT NOT NULL REFERENCES qr_locations(id),
    scanned_at TIMESTAMP DEFAULT NOW()
);

-- VOO / Ide Kaizen Submissions
CREATE TABLE voo_submissions (
    id SERIAL PRIMARY KEY,
    operator_id INT NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
    submitted_by_id INT NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'VoO',
    photos JSONB DEFAULT '[]',
    status VARCHAR(30) DEFAULT 'pending',
    points INT DEFAULT 0,
    rejection_reason TEXT,
    foreman_approved_by INT,
    manager_approved_by INT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Misconduct
CREATE TABLE misconducts (
    id SERIAL PRIMARY KEY,
    operator_id INT NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
    created_by_id INT NOT NULL REFERENCES users(id),
    type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) DEFAULT 'low',
    description TEXT NOT NULL,
    evidence_photos JSONB DEFAULT '[]',
    points INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Counseling
CREATE TABLE counselings (
    id SERIAL PRIMARY KEY,
    operator_id INT NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
    foreman_id INT NOT NULL REFERENCES users(id),
    topic VARCHAR(255) NOT NULL,
    notes TEXT DEFAULT '',
    date TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Kartu Kuning
CREATE TABLE kartu_kunings (
    id SERIAL PRIMARY KEY,
    operator_id INT NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
    issued_by_id INT NOT NULL REFERENCES users(id),
    reason TEXT NOT NULL,
    issued_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Surat Peringatan
CREATE TABLE surat_peringatans (
    id SERIAL PRIMARY KEY,
    operator_id INT NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
    issued_by_id INT NOT NULL REFERENCES users(id),
    level INT NOT NULL CHECK (level IN (1, 2, 3)),
    reason TEXT NOT NULL,
    issued_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Approval (Append Only)
CREATE TABLE approvals (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT NOT NULL,
    approver_id INT NOT NULL REFERENCES users(id),
    action VARCHAR(20) NOT NULL,
    notes TEXT,
    voo_submission_id INT REFERENCES voo_submissions(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Event Log (Append Only)
CREATE TABLE event_logs (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    module VARCHAR(50) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_event_logs_user ON event_logs(user_id);
CREATE INDEX idx_event_logs_module ON event_logs(module);
CREATE INDEX idx_event_logs_created ON event_logs(created_at);

-- Blockchain Hash
CREATE TABLE blockchain_hashes (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT NOT NULL,
    tx_hash VARCHAR(66),
    block_number BIGINT,
    contract_address VARCHAR(42),
    data TEXT NOT NULL,
    voo_submission_id INT REFERENCES voo_submissions(id),
    misconduct_id INT REFERENCES misconducts(id),
    created_by_id INT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);
