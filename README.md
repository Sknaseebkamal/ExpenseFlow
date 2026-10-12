# ExpenseFlow – Expense Voucher Management System

A role-based web application for managing employee expense vouchers, streamlining approval workflows, and maintaining expense records.

## Setup

### Requirements

* Node.js and npm
* MySQL Server
* Visual Studio Code
* Git (optional)
* Postman (optional, for API testing)

### Installation

**1. Configure the database**

Start your MySQL server and create the application database:

```sql
CREATE DATABASE expenseflow;
```

**2. Install backend dependencies**

Open a terminal in the project root:

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` directory.

Example configuration:

```env
PORT=5000
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=expenseflow
JWT_SECRET=replace_with_a_strong_random_secret
```

Replace the example values with your actual MySQL credentials. The environment variable names must match those used in your backend code.

**3. Start the backend**

```bash
npm run dev
```

This command assumes your backend defines a `dev` script in `backend/package.json`.

The example backend URL is:

```text
http://localhost:5000
```

**4. Install and start the frontend**

Open a second terminal from the project root:

```bash
cd frontend
npm install
npm run dev
```

Open the frontend URL displayed in the terminal. With the default Vite configuration, it is usually:

```text
http://localhost:5173
```

**Note:** These instructions assume your project uses the directory structure and npm scripts described above. Check your actual configuration if a command fails.

## Demo Accounts

The following credentials are examples for local testing. They work only if matching accounts have been created in your database.

| Role     | Email                                               | Password         |
| -------- | --------------------------------------------------- | ---------------- |
| Employee | [employee@example.com](mailto:employee@example.com) | TestPass123!     |
| Director | [director@example.com](mailto:director@example.com) | Director@123     |
| Accounts | [accounts@example.com](mailto:accounts@example.com) | AccountsPass123! |

### Employee

* Create expense vouchers.
* Save vouchers as drafts.
* Submit vouchers for approval.
* Track voucher approval status.
* View rejection reasons and remarks.

### Director

* View submitted expense vouchers.
* Review expense details and claimed amounts.
* Approve pending vouchers.
* Reject vouchers with a reason.
* Monitor approval decisions.

### Accounts

* View expense voucher records.
* Monitor approval and rejection statuses.
* Access voucher information in read-only mode.
* Review expense records for accounting purposes.

## Architecture

* **Frontend:** React and Vite for the user interface, with Axios for HTTP communication and CSS for styling.
* **Backend:** Node.js and Express.js for REST API development.
* **Authentication:** JSON Web Tokens (JWT) for authenticated sessions.
* **Authorization:** Role-based access control for Employee, Director, and Accounts users.
* **Database:** MySQL for storing user accounts and expense voucher records.
* **API Testing:** Postman for testing authentication, voucher operations, and access permissions.

### Project Structure

```text
Expense-Voucher-System/
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
```

This is a representative structure. Update it to match the actual files and folders in your repository.

## Application Workflow

ExpenseFlow follows a role-based expense voucher approval process.

```text
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
   v
Review Voucher
   |
   +-------------------+
   |                   |
   v                   v
Approve              Reject
   |                   |
   v                   v
Approved             Rejected
Status               + Reason
   |                   |
   +---------+---------+
             |
             v
      ACCOUNTS DASHBOARD
             |
             v
   View Voucher Records
      and Their Status
```

## Database Schema

The application uses MySQL to store user and expense voucher information.

The exact tables and columns depend on your backend database implementation.

### User

Stores user account information and application roles.

| Field      | Description                                             |
| ---------- | ------------------------------------------------------- |
| `id`       | Unique user identifier.                                 |
| `name`     | User's display name.                                    |
| `email`    | User's login email address.                             |
| `password` | Should store a securely hashed password, not plaintext. |
| `role`     | User role: Employee, Director, or Accounts.             |

### Expense Voucher

Stores expense details and tracks the approval workflow.

| Field             | Description                                         |
| ----------------- | --------------------------------------------------- |
| `id`              | Unique voucher identifier.                          |
| `voucherDate`     | Date of the voucher.                                |
| `expenseDate`     | Date the expense occurred.                          |
| `department`      | Employee's department.                              |
| `title`           | Expense title.                                      |
| `category`        | Expense category.                                   |
| `description`     | Details about the expense.                          |
| `amount`          | Claimed expense amount.                             |
| `status`          | Current voucher status.                             |
| `rejectionReason` | Reason provided when a voucher is rejected.         |
| `employeeId`      | Identifier of the employee who created the voucher. |
| `createdAt`       | Voucher creation timestamp.                         |
| `updatedAt`       | Last modification timestamp.                        |

**Important:** These tables and field names describe the intended data model. Confirm them against your actual MySQL schema and backend code before treating this section as the definitive database specification.

### Voucher Statuses

| Status             | Description                                     |
| ------------------ | ----------------------------------------------- |
| `DRAFT`            | Voucher saved but not submitted.                |
| `PENDING_APPROVAL` | Voucher submitted and awaiting director review. |
| `APPROVED`         | Voucher approved by the director.               |
| `REJECTED`         | Voucher rejected with a recorded reason.        |

The intended workflow is:

```text
DRAFT
  |
  v
PENDING_APPROVAL
  |
  +----------------+
  |                |
  v                v
APPROVED         REJECTED
```

## API Documentation

The backend exposes REST API endpoints for authentication, expense voucher management, and approval operations.

Example API base URL:

```text
http://localhost:5000/api
```

The exact endpoint paths depend on your backend route definitions.

### Authentication

#### Login

```http
POST /api/auth/login
```

Authenticates a user and returns an authentication token if the credentials are valid.

Example request:

```json
{
  "email": "employee@example.com",
  "password": "TestPass123!"
}
```

The response should contain the JWT token and relevant user information, according to your implementation.

### Protected API Requests

Authenticated endpoints commonly use this HTTP header:

```http
Authorization: Bearer <jwt-token>
```

JSON requests commonly use:

```http
Content-Type: application/json
```

### Employee Voucher Operations

Employee operations may include:

* Create an expense voucher.
* Save a voucher as a draft.
* Update a draft voucher.
* Submit a voucher for approval.
* View personal voucher records.
* Track approval status and rejection reasons.

Example endpoint patterns:

```http
GET    /api/vouchers
POST   /api/vouchers
GET    /api/vouchers/:id
PUT    /api/vouchers/:id
PATCH  /api/vouchers/:id
DELETE /api/vouchers/:id
```

These are common REST API patterns, not a claim that every endpoint is implemented. Keep only the paths and HTTP methods supported by your backend.

### Director Approval Operations

Director operations may include:

* View vouchers awaiting approval.
* Review voucher details.
* Approve submitted vouchers.
* Reject vouchers with a reason.
* View approval and rejection statuses.

Example endpoint patterns:

```http
GET  /api/vouchers
POST /api/vouchers/:id/approve
POST /api/vouchers/:id/reject
```

The backend must verify that the authenticated user has the Director role before performing approval or rejection operations.

### Accounts Operations

Accounts users can view voucher records and monitor their statuses.

Example endpoint pattern:

```http
GET /api/vouchers
```

Accounts access should remain read-only if that is the permission policy implemented by the application.

### Error Handling

A REST API should return appropriate HTTP status codes for common errors.

| Status Code | Meaning                                                   |
| ----------- | --------------------------------------------------------- |
| `400`       | Invalid request or validation failure.                    |
| `401`       | Authentication is missing or invalid.                     |
| `403`       | The user does not have the required permissions.          |
| `404`       | The requested resource was not found.                     |
| `409`       | The operation conflicts with the voucher's current state. |
| `500`       | Unexpected server error.                                  |

The actual error response format depends on your backend implementation.

## Security

ExpenseFlow uses authentication and role-based authorization to protect expense voucher operations.

### JWT Authentication

JWT tokens are used to authenticate users and authorize access to protected API routes.

### Role-Based Authorization

The application separates permissions among three roles:

* **Employee:** Creates, submits, and tracks expense vouchers.
* **Director:** Reviews, approves, or rejects submitted vouchers.
* **Accounts:** Views voucher records and approval statuses.

### Backend Authorization

Authorization must be enforced by the backend. Hiding buttons or pages in the frontend alone does not prevent unauthorized API requests.

### Input Validation

Voucher details, claimed amounts, required fields, and rejection reasons should be validated before database operations.

### Secure Configuration

* Store database credentials and JWT secrets in environment variables.
* Do not commit the real `.env` file to GitHub.
* Use securely hashed passwords.
* Use dedicated demo accounts for testing.
* Avoid publishing production credentials.

## Testing

Before submitting or deploying the project, verify the following functionality.

| Test Case                      | Expected Result                                        |
| ------------------------------ | ------------------------------------------------------ |
| Valid login credentials        | User is authenticated.                                 |
| Invalid login credentials      | Access is denied.                                      |
| Employee creates a voucher     | Voucher is saved.                                      |
| Employee saves a draft         | Voucher remains in draft status.                       |
| Employee submits a voucher     | Voucher enters the approval workflow.                  |
| Director approves a voucher    | Status changes to approved.                            |
| Director rejects a voucher     | Status changes to rejected and the reason is recorded. |
| Employee views voucher status  | Correct status is displayed.                           |
| Accounts views voucher records | Records are visible in read-only mode.                 |
| Unauthorized API request       | Access is denied.                                      |
| Invalid request data           | Appropriate validation error is returned.              |
| Invalid API endpoint           | Appropriate error response is returned.                |

### End-to-End Testing

1. Log in using an Employee account.
2. Create an expense voucher.
3. Save the voucher as a draft.
4. Submit the voucher for approval.
5. Log out and sign in as a Director.
6. Review the submitted voucher.
7. Approve or reject the voucher.
8. If rejected, provide a reason.
9. Sign in as the Employee and verify the updated status.
10. Sign in as Accounts and confirm that the voucher is visible.
11. Test that Accounts cannot perform restricted modifications through direct API requests.

## Project Status

**Current Status:** Core application workflow implemented; final verification pending.

The project is intended to support employee voucher management, director approval, and read-only Accounts access.

Before marking the project as complete, verify:

* Login and JWT authentication.
* Role-based authorization on protected API endpoints.
* Voucher creation, draft saving, and submission.
* Director approval and rejection.
* Recording and displaying rejection reasons.
* Accounts read-only permissions.
* Database operations and error handling.
* End-to-end workflow testing.

Update this status after completing the tests and confirming their results.

## Future Enhancements

Potential improvements include:

* Email notifications for approvals and rejections.
* Expense reports and downloadable summaries.
* Voucher search, filtering, and pagination.
* Audit logs for approval decisions.
* Dashboard analytics and expense summaries.
* Automated unit and integration tests.
* Cloud deployment with HTTPS.
* Password reset and login rate limiting.

## Learning Outcomes

This project provides practical experience in:

* Full-stack web application development.
* React and Vite frontend development.
* REST API development using Node.js and Express.js.
* JWT-based authentication.
* Role-based authorization.
* MySQL database integration.
* Expense voucher workflow management.
* API testing with Postman.
* Input validation and application security.
* Git and GitHub version control.

## Author

**SK Naseeb Kamal**

B.Tech in Computer Science and Engineering

GitHub: [Sknaseebkamal](https://github.com/Sknaseebkamal)

## Conclusion

ExpenseFlow provides a structured approach to managing employee expense vouchers through a role-based approval workflow.

By separating employee, director, and accounts responsibilities, the application helps organize expense submissions, approval decisions, and financial records.

The project demonstrates practical implementation of full-stack development, database integration, authentication, authorization, and REST API communication.

**ExpenseFlow — Simplifying Expense Voucher Management Through a Secure, Role-Based Workflow.**
