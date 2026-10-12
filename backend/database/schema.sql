CREATE DATABASE IF NOT EXISTS expenseflow
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE expenseflow;

CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    employee_id VARCHAR(50) NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(254) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('EMPLOYEE', 'DIRECTOR', 'ACCOUNTS') NOT NULL DEFAULT 'EMPLOYEE',
    department VARCHAR(150) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_employee_id (employee_id),
    UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS expense_vouchers (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    voucher_number VARCHAR(64) NOT NULL,
    employee_user_id INT UNSIGNED NOT NULL,
    voucher_date DATE NOT NULL,
    expense_date DATE NOT NULL,
    department VARCHAR(150) NOT NULL,
    expense_title VARCHAR(200) NOT NULL,
    expense_category VARCHAR(100) NULL,
    expense_description TEXT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    employee_signature VARCHAR(255) NULL,
    director_signature VARCHAR(255) NULL,
    status ENUM('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED')
        NOT NULL DEFAULT 'DRAFT',
    approval_date DATETIME NULL,
    rejection_reason TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_expense_vouchers_number (voucher_number),
    KEY idx_expense_vouchers_employee_created (employee_user_id, created_at),
    KEY idx_expense_vouchers_status (status),
    CONSTRAINT fk_expense_vouchers_employee
        FOREIGN KEY (employee_user_id)
        REFERENCES users (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT chk_expense_vouchers_amount CHECK (amount > 0)
) ENGINE=InnoDB;
