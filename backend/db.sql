-- Create table for users
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Create table for clients
CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    status TEXT NOT NULL,
    additional_details JSON,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Create table for client_property_interests
CREATE TABLE IF NOT EXISTS client_property_interests (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    property_type TEXT NOT NULL,
    preferred_location TEXT NOT NULL,
    price_min NUMERIC,
    price_max NUMERIC,
    additional_notes TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (client_id) REFERENCES clients(id)
);

-- Create table for properties
CREATE TABLE IF NOT EXISTS properties (
    id TEXT PRIMARY KEY,
    address TEXT NOT NULL,
    property_type TEXT NOT NULL,
    price NUMERIC NOT NULL,
    status TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Create table for appointments
CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    property_id TEXT,
    agent_id TEXT NOT NULL,
    appointment_date TEXT NOT NULL,
    appointment_time TEXT NOT NULL,
    notes TEXT,
    is_confirmed BOOLEAN NOT NULL DEFAULT false,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (property_id) REFERENCES properties(id),
    FOREIGN KEY (agent_id) REFERENCES users(id)
);

-- Create table for communication_logs
CREATE TABLE IF NOT EXISTS communication_logs (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    communication_type TEXT NOT NULL,
    note TEXT NOT NULL,
    follow_up_flag BOOLEAN NOT NULL DEFAULT false,
    timestamp TEXT NOT NULL,
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create table for client_documents
CREATE TABLE IF NOT EXISTS client_documents (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    document_name TEXT NOT NULL,
    document_url TEXT NOT NULL,
    document_type TEXT NOT NULL,
    uploaded_at TEXT NOT NULL,
    FOREIGN KEY (client_id) REFERENCES clients(id)
);

-- Create table for user_settings
CREATE TABLE IF NOT EXISTS user_settings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    dashboard_preferences JSON,
    notification_settings JSON,
    configuration JSON,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

--------------------------------------------------------
-- SEED THE DATABASE WITH EXAMPLE DATA
--------------------------------------------------------

-- Seed data for users table
INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at) VALUES
('u1', 'admin_user', 'admin@estatehub.co.uk', 'hash_admin', 'admin', '2023-10-01T12:00:00', '2023-10-01T12:00:00'),
('u2', 'agent_john', 'john.doe@estatehub.co.uk', 'hash_john', 'agent', '2023-10-02T09:00:00', '2023-10-02T09:00:00'),
('u3', 'agent_jane', 'jane.smith@estatehub.co.uk', 'hash_jane', 'agent', '2023-10-03T10:00:00', '2023-10-03T10:00:00'),
('u4', 'support_sam', 'sam.support@estatehub.co.uk', 'hash_sam', 'support', '2023-10-04T08:30:00', '2023-10-04T08:30:00'),
('u5', 'manager_mike', 'mike.manager@estatehub.co.uk', 'hash_mike', 'manager', '2023-10-05T11:15:00', '2023-10-05T11:15:00');

-- Seed data for clients table
INSERT INTO clients (id, first_name, last_name, email, phone, address, status, additional_details, created_at, updated_at) VALUES
('c1', 'Alice', 'Wonderland', 'alice@sample.co.uk', '07123456789', '123 Baker Street, London, UK', 'active', '{"preferred_contact": "email"}', '2023-10-01T13:00:00', '2023-10-01T13:00:00'),
('c2', 'Bob', 'Builder', 'bob.builder@sample.co.uk', '07987654321', '456 High Street, Manchester, UK', 'prospective', NULL, '2023-10-02T14:00:00', '2023-10-02T14:00:00'),
('c3', 'Charlie', 'Chaplin', 'charlie.chaplin@sample.co.uk', '07894561234', '789 Low Street, Birmingham, UK', 'active', '{"interest": "commercial"}', '2023-10-03T15:00:00', '2023-10-03T15:00:00');

-- Seed data for client_property_interests table
INSERT INTO client_property_interests (id, client_id, property_type, preferred_location, price_min, price_max, additional_notes, created_at) VALUES
('cpi1', 'c1', 'residential', 'London', 500000, 1000000, 'Looking for modern apartment', '2023-10-02T12:00:00'),
('cpi2', 'c2', 'commercial', 'Manchester', 200000, 500000, 'Need space for small business', '2023-10-03T16:30:00');

-- Seed data for properties table
INSERT INTO properties (id, address, property_type, price, status, description, created_at, updated_at) VALUES
('p1', '10 Downing Street, London, UK', 'residential', 750000, 'for sale', 'Historic building with modern amenities', '2023-10-04T10:00:00', '2023-10-04T10:00:00'),
('p2', '1 King Street, Manchester, UK', 'commercial', 350000, 'sold', 'Prime location for business', '2023-10-05T11:00:00', '2023-10-05T11:00:00');

-- Seed data for appointments table
INSERT INTO appointments (id, client_id, property_id, agent_id, appointment_date, appointment_time, notes, is_confirmed, created_at, updated_at) VALUES
('a1', 'c1', 'p1', 'u2', '2023-10-05', '14:00', 'Initial viewing appointment', true, '2023-10-04T11:00:00', '2023-10-04T11:00:00'),
('a2', 'c2', NULL, 'u3', '2023-10-06', '16:00', 'Discuss property requirements', false, '2023-10-05T12:00:00', '2023-10-05T12:00:00');

-- Seed data for communication_logs table
INSERT INTO communication_logs (id, client_id, user_id, communication_type, note, follow_up_flag, timestamp) VALUES
('cl1', 'c1', 'u2', 'email', 'Sent property brochure', false, '2023-10-02T10:00:00'),
('cl2', 'c2', 'u3', 'call', 'Left voicemail regarding appointment', true, '2023-10-03T11:30:00'),
('cl3', 'c1', 'u4', 'meeting', 'Discussed financing options', true, '2023-10-04T09:00:00');

-- Seed data for client_documents table
INSERT INTO client_documents (id, client_id, document_name, document_url, document_type, uploaded_at) VALUES
('cd1', 'c1', 'ID Proof', 'https://picsum.photos/seed/id1/300/200', 'id', '2023-10-02T14:00:00'),
('cd2', 'c2', 'Contract', 'https://picsum.photos/seed/contract1/300/200', 'contract', '2023-10-03T15:30:00');

-- Seed data for user_settings table
INSERT INTO user_settings (id, user_id, dashboard_preferences, notification_settings, configuration, updated_at) VALUES
('us1', 'u1', '{"theme": "dark", "layout": "grid"}', '{"email": true, "in_app": true}', '{"language": "en-UK"}', '2023-10-01T14:00:00'),
('us2', 'u2', '{"theme": "light", "layout": "list"}', '{"email": false, "in_app": true}', '{"language": "en-UK"}', '2023-10-02T15:00:00');