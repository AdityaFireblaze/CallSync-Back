-- Create Database
CREATE DATABASE callsync;

-- Connect to database
\c callsync;

-- Employees Table
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    department VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_sync TIMESTAMP
);

-- Call Recordings Table
CREATE TABLE recordings (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    employee_code VARCHAR(10) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    phone_number VARCHAR(50),
    call_duration INTEGER,
    call_timestamp TIMESTAMP,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_employee_code ON employees(code);
CREATE INDEX idx_employee_active ON employees(is_active);
CREATE INDEX idx_recording_employee ON recordings(employee_id);
CREATE INDEX idx_recording_timestamp ON recordings(call_timestamp DESC);
CREATE INDEX idx_recording_uploaded ON recordings(uploaded_at DESC);

-- Insert sample employees for testing
INSERT INTO employees (name, code, email, department) VALUES
('John Doe', 'A1B2C3', 'john@company.com', 'Sales'),
('Jane Smith', 'D4E5F6', 'jane@company.com', 'Marketing'),
('Mike Johnson', 'G7H8I9', 'mike@company.com', 'Support');