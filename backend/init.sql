-- Create database
CREATE DATABASE IF NOT EXISTS techassess;
USE techassess;

-- Table: security_logs
CREATE TABLE IF NOT EXISTS security_logs (
    log_id INT PRIMARY KEY,
    user_id INT NOT NULL,
    access_time VARCHAR(10) NOT NULL,
    date VARCHAR(20) NOT NULL,
    action VARCHAR(50) NOT NULL
);

-- Table: employees
CREATE TABLE IF NOT EXISTS employees (
    user_id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(50) NOT NULL,
    position VARCHAR(50) NOT NULL
);

-- Table: access_history
CREATE TABLE IF NOT EXISTS access_history (
    access_id INT PRIMARY KEY,
    user_id INT NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    date VARCHAR(20) NOT NULL,
    time VARCHAR(10) NOT NULL
);

-- Table: employee_records
CREATE TABLE IF NOT EXISTS employee_records (
    user_id INT PRIMARY KEY,
    status VARCHAR(20) NOT NULL,
    disciplinary_action VARCHAR(50),
    termination_date VARCHAR(20)
);

-- Table: network_traffic
CREATE TABLE IF NOT EXISTS network_traffic (
    traffic_id INT PRIMARY KEY,
    user_id INT NOT NULL,
    destination_ip VARCHAR(20) NOT NULL,
    data_size_mb INT NOT NULL,
    timestamp VARCHAR(30) NOT NULL
);

-- Insert data into security_logs
INSERT INTO security_logs (log_id, user_id, access_time, date, action) VALUES
(1, 101, '14:30', '2024-01-15', 'login'),
(2, 102, '15:45', '2024-01-15', 'login'),
(3, 103, '23:45', '2024-01-15', 'login'),
(4, 103, '23:47', '2024-01-15', 'database_access'),
(5, 101, '09:00', '2024-01-16', 'login');

-- Insert data into employees
INSERT INTO employees (user_id, name, department, position) VALUES
(101, 'Alice Johnson', 'IT', 'Developer'),
(102, 'Bob Smith', 'HR', 'Manager'),
(103, 'Charlie Davis', 'IT', 'Database Admin'),
(104, 'Diana Wilson', 'Finance', 'Analyst');

-- Insert data into access_history
INSERT INTO access_history (access_id, user_id, table_name, date, time) VALUES
(1, 103, 'customers', '2024-01-15', '23:47'),
(2, 103, 'financial_records', '2024-01-15', '23:48'),
(3, 103, 'salary_data', '2024-01-15', '23:50'),
(4, 101, 'products', '2024-01-15', '14:35');

-- Insert data into employee_records
INSERT INTO employee_records (user_id, status, disciplinary_action, termination_date) VALUES
(101, 'active', 'none', NULL),
(102, 'active', 'none', NULL),
(103, 'terminated', 'termination_pending', '2024-01-20'),
(104, 'active', 'none', NULL);

-- Insert data into network_traffic
INSERT INTO network_traffic (traffic_id, user_id, destination_ip, data_size_mb, timestamp) VALUES
(1, 103, '185.220.101.45', 250, '2024-01-15 23:52'),
(2, 101, '192.168.1.10', 5, '2024-01-15 14:40'),
(3, 102, '192.168.1.15', 2, '2024-01-15 15:50');
