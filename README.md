ExpenseFlow – Expense Voucher Management System

A role-based web application for managing employee expense vouchers, streamlining approval workflows, and maintaining expense records.

1. Project Overview

ExpenseFlow is a web-based Expense Voucher Management System designed to simplify and organize the employee expense reimbursement process.

The application allows employees to create, manage, and submit expense vouchers for approval. Directors can review submitted vouchers and approve or reject claims with appropriate remarks. Accounts personnel can view voucher records and monitor their approval status through a read-only interface.

The system uses JWT authentication and role-based authorization to control access to application features according to each user's role.

2. Key Features
Employee Module
Secure login and authentication.
Create and manage expense vouchers.
Save vouchers as drafts.
Submit expense vouchers for approval.
Track voucher approval status.
View rejection reasons and remarks.
Director Module
View submitted expense vouchers.
Review expense details and claimed amounts.
Approve pending expense vouchers.
Reject vouchers with a specified reason.
Monitor voucher approval status.
Accounts Module
View expense voucher records.
Monitor approval and rejection statuses.
Access voucher information in read-only mode.
Review expense records without modifying approval decisions.
3. Technology Stack
Component	Technologies
Frontend	React, Vite, Axios, CSS
Backend	Node.js, Express.js
Authentication	JSON Web Token (JWT)
Database	MySQL
API Communication	REST API
Development Tools	Visual Studio Code, npm, Postman
4. Application Workflow

ExpenseFlow follows a role-based expense voucher approval workflow.

Employee: Logs in, creates an expense voucher, saves it as a draft if necessary, and submits it for approval.
Director: Reviews the submitted voucher and approves or rejects it.
Employee: Checks the voucher status and reviews the rejection reason, if applicable.
Accounts: Views voucher records and their current statuses for accounting and record-keeping purposes.
Workflow Diagram
                 EMPLOYEE
                    |
                    v
           Create Expense Voucher
                    |
                    v
             Save as Draft
                    |
                    v
            Submit for Approval
                    |
                    v
                 DIRECTOR
                    |
             Review Voucher
                    |
             +------+------+
             |             |
             v             v
          Approve        Reject
             |             |
             v             v
       Approved Status  Rejection Reason
             |             |
             +------+------+
                    |
                    v
          ACCOUNTS DASHBOARD
                    |
                    v
       View Voucher Records and Status
5. Project Structure
Expense-Voucher-System/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── config/
│   ├── middleware/
│   ├── routes/
│   ├── package.json
│   ├── server.js
│   └── .env
│
└── README.md

Note: This is a representative structure. Update it if your actual project contains different files or directories.

6. Prerequisites

Install the following software before running the application:

Node.js and npm
MySQL Server
Visual Studio Code
Postman (optional, for API testing)
Git (optional, for version control)
7. Installation and Setup
Step 1: Configure the MySQL Database
Start your MySQL server.
Open MySQL Workbench or another MySQL client.
Create the application database.
CREATE DATABASE expenseflow;
Configure the database connection using the backend environment variables.
Ensure that the database name, username, password, and connection settings match your backend configuration.

Important: Use the database name expected by your application. Update the example above if your project uses a different database name.

Step 2: Configure the Backend

Open a terminal in the project directory:

cd backend

Install the backend dependencies:

npm install

Create a .env file in the backend directory.

Example configuration:

PORT=5000
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=expenseflow
JWT_SECRET=replace_with_a_strong_random_secret

Configuration notes:

Replace the example database credentials with your local MySQL credentials.
Use a strong, randomly generated JWT secret.
The environment variable names must match those referenced in your backend code.
Never upload real credentials or secrets to a public GitHub repository.

Start the backend server:

npm run dev

This command assumes that the backend/package.json file defines a dev script. If it does not, use the start command configured in your project.

Step 3: Configure the Frontend

Open a second terminal and navigate to the frontend directory:

cd frontend

Install the frontend dependencies:

npm install

Start the Vite development server:

npm run dev

Open the local URL displayed in the terminal.

Step 5: Verify the Application

After starting both servers:

Confirm that the backend starts successfully.
Confirm that the frontend loads in your browser.
Verify that the frontend can communicate with the backend API.
Log in using a configured demo account.
Test the features available to each role.
Verify that unauthorized API requests are rejected.
8. Demo Login Credentials

The following demo accounts are intended for testing the different user roles in ExpenseFlow.

Role	        Email	                Password
Employee	employee@example.com	  TestPass123!
Director	director@example.com	  Director@123
Accounts	accounts@example.com	  AccountsPass123!
Employee Account

Email: employee@example.com

Password: TestPass123!

Available operations:

Create expense vouchers.
Save vouchers as drafts.
Submit vouchers for approval.
Track voucher status.
View rejection reasons.
Director Account

Email: director@example.com

Password: Director@123

Available operations:

View submitted expense vouchers.
Review expense details.
Approve pending vouchers.
Reject vouchers with a reason.
Accounts Account

Email: accounts@example.com

Password: AccountsPass123!

Available operations:

View expense voucher records.
Check voucher statuses.
Access expense information in read-only mode.
Demo Account Notes
These credentials must correspond to accounts created in the application's database.
Ensure that each account has the correct role assigned.
If the accounts have not been configured, create them using your application's supported user-registration or account-provisioning process.
Do not assume that these accounts exist automatically after installing the application.
For public repositories, use dedicated demo accounts with restricted permissions and non-sensitive test data.
Never publish real user credentials or production passwords.
9. Security

ExpenseFlow uses authentication and authorization mechanisms to protect expense voucher operations.

Security Features

JWT Authentication

JSON Web Tokens are used to authenticate users and support protected API access.

Role-Based Authorization

Application permissions are separated by role:

Employee
Director
Accounts

Protected API Routes

Restricted backend endpoints should verify the user's authentication and permissions before allowing operations.

Input Validation

User input should be validated to help prevent invalid voucher data and malformed requests.

Environment Variables

Sensitive configuration values, including database credentials and JWT secrets, should be stored in environment variables rather than committed to source control.

Backend Authorization

Access restrictions must be enforced by the backend. Hiding buttons or pages in the frontend alone does not prevent unauthorized API access.

10. Testing

Perform the following checks before submitting or deploying the application.

Test Case	Expected Result
Valid login credentials	User is authenticated successfully
Invalid login credentials	Access is denied
Employee creates a voucher	Voucher is saved successfully
Employee saves a draft	Voucher remains in draft status
Employee submits a voucher	Voucher enters the approval workflow
Director approves a voucher	Voucher status changes to approved
Director rejects a voucher	Voucher is rejected with a recorded reason
Employee views voucher status	Correct status is displayed
Accounts views vouchers	Records are accessible in read-only mode
Accounts attempts a restricted modification	Backend denies the operation
Unauthorized API request	Access is denied
Invalid API endpoint	Appropriate error response is returned
Invalid request data	Validation error is returned
Recommended End-to-End Test
Log in as an employee.
Create an expense voucher.
Save the voucher as a draft and verify its status.
Submit the voucher for approval.
Log out and log in as a director.
Review the submitted voucher.
Approve or reject the voucher.
If rejected, provide a reason.
Log in as the employee and verify the updated status.
Log in as accounts and confirm that the voucher record is visible.
Verify that accounts cannot modify restricted records through direct API requests.
11. Project Status

Current Status: Core application workflow implemented; final verification pending.

The project includes the main employee voucher workflow, director approval process, accounts read-only interface, and role-based functionality.

The following checks should be completed before declaring the project ready for submission:

Verify login and JWT authentication.
Test role-based authorization on protected API endpoints.
Verify voucher creation, draft saving, and submission.
Test director approval and rejection.
Confirm that rejection reasons are recorded and displayed correctly.
Verify accounts read-only permissions.
Test database operations and error handling.
Complete end-to-end workflow testing.

The final completion status should reflect the actual results of these tests.

12. Future Enhancements

Potential improvements for future versions include:

Email notifications for voucher approvals and rejections.
Expense reports and downloadable summaries.
Voucher search, filtering, and pagination.
Audit logs for approval and rejection actions.
Dashboard analytics and expense summaries.
Automated unit and integration tests.
Deployment to a cloud hosting platform.
13. Learning Outcomes

This project provides practical experience in:

Full-stack web application development.
React-based frontend development.
REST API development using Node.js and Express.js.
JWT-based authentication.
Role-based authorization.
MySQL database integration.
Expense voucher workflow management.
API testing with Postman.
Application security and input validation.
Git and GitHub version control.
14. Author

SK Naseeb Kamal

B.Tech in Computer Science and Engineering

GitHub: Sknaseebkamal

15. Conclusion

ExpenseFlow provides a structured approach to managing employee expense vouchers through a role-based approval workflow. By separating employee, director, and accounts responsibilities, the application helps organize expense submissions, approval decisions, and voucher records.

The project demonstrates practical implementation of full-stack development, database integration, authentication, authorization, and REST API communication.

ExpenseFlow — Simplifying Expense Voucher Management Through a Secure, Role-Based Workflow.