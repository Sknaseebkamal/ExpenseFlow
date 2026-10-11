import { useEffect, useState } from "react";
import api from "./api";
import "./App.css";

const today = () => new Date().toISOString().slice(0, 10);

const emptyVoucher = {
  voucher_date: today(),
  expense_date: today(),
  department: "",
  expense_title: "",
  expense_category: "",
  expense_description: "",
  amount: "",
  employee_signature: "",
};

function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [vouchers, setVouchers] = useState([]);
  const [summary, setSummary] = useState({});
  const [form, setForm] = useState(emptyVoucher);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [directorSignature, setDirectorSignature] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const role = user?.role;

  async function handleLogin(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      setUser(response.data.user);
      setPassword("");
      setMessage("Login successful.");
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to log in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadVouchers() {
    if (!user) return;

    setLoading(true);
    setError("");

    try {
      let response;

      if (role === "EMPLOYEE") {
        response = await api.get("/vouchers/my");
        setVouchers(response.data.vouchers || []);
      } else if (role === "DIRECTOR") {
        response = await api.get("/director/vouchers");
        setVouchers(response.data.vouchers || []);
      } else if (role === "ACCOUNTS") {
        response = await api.get("/accounts/vouchers");
        setVouchers(response.data.vouchers || []);

        try {
          const summaryResponse = await api.get("/accounts/summary");
          setSummary(summaryResponse.data.summary || {});
        } catch {
          setSummary({});
        }
      } else {
        setError("Your account has an unrecognized role.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load vouchers. Please try logging in again."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) {
      loadVouchers();
    }
    // Reload when the authenticated user changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.role]);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
    setVouchers([]);
    setSummary({});
    setSelectedVoucher(null);
    setShowForm(false);
    setMessage("");
    setError("");
    setEmail("");
    setPassword("");
  }

  function openCreateForm() {
    setEditingId(null);
    setForm({
      ...emptyVoucher,
      voucher_date: today(),
      expense_date: today(),
      department: user?.department || "",
    });
    setShowForm(true);
    setMessage("");
    setError("");
  }

  function openEditForm(voucher) {
    if (voucher.status !== "DRAFT") return;

    setEditingId(voucher.id);

    setForm({
      voucher_date: String(voucher.voucher_date).slice(0, 10),
      expense_date: String(voucher.expense_date).slice(0, 10),
      department: voucher.department || "",
      expense_title: voucher.expense_title || "",
      expense_category: voucher.expense_category || "",
      expense_description: voucher.expense_description || "",
      amount: voucher.amount ?? "",
      employee_signature: voucher.employee_signature || "",
    });

    setShowForm(true);
    setMessage("");
    setError("");
  }

  function updateField(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function saveVoucher(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const amount = Number(form.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Please enter an amount greater than zero.");
      return;
    }

    setLoading(true);

    try {
      const payload = { ...form, amount };

      const response = editingId
        ? await api.put(`/vouchers/${editingId}`, payload)
        : await api.post("/vouchers", payload);

      setMessage(
        response.data.message ||
          (editingId ? "Draft updated successfully." : "Draft created successfully.")
      );

      setShowForm(false);
      setEditingId(null);
      setForm(emptyVoucher);

      await loadVouchers();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save this voucher.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteVoucher(voucher) {
    if (role !== "EMPLOYEE" || voucher.status !== "DRAFT") return;

    if (!window.confirm(`Delete draft ${voucher.voucher_number}?`)) return;

    setError("");
    setMessage("");

    try {
      const response = await api.delete(`/vouchers/${voucher.id}`);
      setMessage(response.data.message || "Draft deleted successfully.");
      await loadVouchers();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete this draft.");
    }
  }

  async function submitVoucher(voucher) {
    if (voucher.status !== "DRAFT") return;

    if (!voucher.employee_signature?.trim()) {
      setError(
        `Edit ${voucher.voucher_number} and enter your signature before submitting.`
      );
      return;
    }

    if (!window.confirm(`Submit ${voucher.voucher_number} for approval?`)) {
      return;
    }

    setError("");
    setMessage("");

    try {
      const response = await api.patch(`/vouchers/${voucher.id}/submit`);
      setMessage(response.data.message || "Voucher submitted successfully.");
      await loadVouchers();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to submit this voucher.");
    }
  }

  async function approveVoucher(voucher) {
    if (voucher.status !== "PENDING_APPROVAL") return;

    if (!directorSignature.trim()) {
      setError("Enter your Director signature before approving.");
      return;
    }

    if (!window.confirm(`Approve voucher ${voucher.voucher_number}?`)) return;

    setError("");
    setMessage("");

    try {
      const response = await api.patch(
        `/director/vouchers/${voucher.id}/approve`,
        { director_signature: directorSignature.trim() }
      );

      setMessage(response.data.message || "Voucher approved successfully.");
      setSelectedVoucher(null);
      setDirectorSignature("");
      await loadVouchers();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to approve this voucher.");
    }
  }

  async function rejectVoucher(voucher) {
    if (voucher.status !== "PENDING_APPROVAL") return;

    if (!rejectionReason.trim()) {
      setError("Enter a rejection reason.");
      return;
    }

    if (!window.confirm(`Reject voucher ${voucher.voucher_number}?`)) return;

    setError("");
    setMessage("");

    try {
      const response = await api.patch(
        `/director/vouchers/${voucher.id}/reject`,
        { rejection_reason: rejectionReason.trim() }
      );

      setMessage(response.data.message || "Voucher rejected successfully.");
      setSelectedVoucher(null);
      setRejectionReason("");
      await loadVouchers();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to reject this voucher.");
    }
  }

  const countStatus = (status) =>
    vouchers.filter((voucher) => voucher.status === status).length;

  const filteredVouchers = vouchers.filter((voucher) => {
    const query = search.toLowerCase();

    const matchesSearch = [
      voucher.voucher_number,
      voucher.expense_title,
      voucher.department,
      voucher.employee_name,
      voucher.employee_email,
      voucher.status,
    ].some((value) => String(value || "").toLowerCase().includes(query));

    const matchesStatus =
      statusFilter === "ALL" || voucher.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatAmount = (amount) =>
    Number(amount || 0).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
    });

  const formatDate = (date) => (date ? String(date).slice(0, 10) : "—");

  if (!user) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="brand-icon">EV</div>
          <h1>ExpenseFlow</h1>
          <p>Expense Voucher Management System</p>

          <form onSubmit={handleLogin}>
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
              autoComplete="username"
              required
            />

            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />

            {error && <p className="error-message">{error}</p>}

            <button type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const isEmployee = role === "EMPLOYEE";
  const isDirector = role === "DIRECTOR";
  const isAccounts = role === "ACCOUNTS";

  const dashboardTitle = isEmployee
    ? "Employee Dashboard"
    : isDirector
      ? "Director Dashboard"
      : "Accounts Dashboard";

  const dashboardSubtitle = isEmployee
    ? "Create, manage, and track your expense vouchers."
    : isDirector
      ? "Review submitted vouchers and make approval decisions."
      : "Review expense records and approval details in read-only mode.";

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">EV</div>
          <div>
            <h2>ExpenseFlow</h2>
            <p>Expense Voucher Management</p>
          </div>
        </div>

        <div className="profile">
          <div>
            <strong>{user.full_name}</strong>
            <p>{role}</p>
          </div>
          <button className="secondary-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="content">
        <div className="welcome">
          <div>
            <p className="eyebrow">{role} PORTAL</p>
            <h1>{dashboardTitle}</h1>
            <p className="subtitle">{dashboardSubtitle}</p>
          </div>

          {isEmployee && (
            <button className="primary-button" onClick={openCreateForm}>
              + Create Voucher
            </button>
          )}
        </div>

        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}

        <div className="stats-grid">
          <StatCard
            title="Total Vouchers"
            value={isAccounts ? summary.total_vouchers ?? vouchers.length : vouchers.length}
            description="Recorded vouchers"
            icon="▤"
          />
          <StatCard
            title="Draft"
            value={isAccounts ? summary.draft_vouchers ?? countStatus("DRAFT") : countStatus("DRAFT")}
            description="Not yet submitted"
            icon="✎"
          />
          <StatCard
            title="Pending Approval"
            value={isAccounts ? summary.pending_vouchers ?? countStatus("PENDING_APPROVAL") : countStatus("PENDING_APPROVAL")}
            description="Awaiting Director review"
            icon="◷"
          />
          <StatCard
            title="Approved"
            value={isAccounts ? summary.approved_vouchers ?? countStatus("APPROVED") : countStatus("APPROVED")}
            description="Successfully approved"
            icon="✓"
          />
        </div>

        {isEmployee && showForm && (
          <section className="panel voucher-form-panel">
            <div className="panel-header">
              <div>
                <h2>{editingId ? "Edit Draft Voucher" : "Create Voucher"}</h2>
                <p>Complete the expense details and save your draft.</p>
              </div>
              <button
                className="secondary-button"
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
              >
                Cancel
              </button>
            </div>

            <form className="voucher-form" onSubmit={saveVoucher}>
              <div className="form-grid">
                <Field label="Voucher Date *">
                  <input
                    name="voucher_date"
                    type="date"
                    value={form.voucher_date}
                    onChange={updateField}
                    required
                  />
                </Field>

                <Field label="Expense Date *">
                  <input
                    name="expense_date"
                    type="date"
                    value={form.expense_date}
                    onChange={updateField}
                    required
                  />
                </Field>

                <Field label="Department *">
                  <input
                    name="department"
                    value={form.department}
                    onChange={updateField}
                    required
                  />
                </Field>

                <Field label="Expense Title *">
                  <input
                    name="expense_title"
                    value={form.expense_title}
                    onChange={updateField}
                    maxLength={200}
                    required
                  />
                </Field>

                <Field label="Expense Category">
                  <select
                    name="expense_category"
                    value={form.expense_category}
                    onChange={updateField}
                  >
                    <option value="">Select category</option>
                    <option>Travel</option>
                    <option>Meals</option>
                    <option>Accommodation</option>
                    <option>Office Supplies</option>
                    <option>Equipment</option>
                    <option>Other</option>
                  </select>
                </Field>

                <Field label="Amount (₹) *">
                  <input
                    name="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.amount}
                    onChange={updateField}
                    required
                  />
                </Field>

                <Field label="Description" wide>
                  <textarea
                    name="expense_description"
                    value={form.expense_description}
                    onChange={updateField}
                    rows="3"
                  />
                </Field>

                <Field label="Employee Signature *" wide>
                  <input
                    name="employee_signature"
                    value={form.employee_signature}
                    onChange={updateField}
                    placeholder="Type your full name as signature"
                    required
                  />
                  <small>Text signature for this prototype; image upload is not implemented yet.</small>
                </Field>
              </div>

              <button className="primary-button" type="submit" disabled={loading}>
                {loading ? "Saving..." : editingId ? "Save Changes" : "Save Draft"}
              </button>
            </form>
          </section>
        )}

        {isDirector && (
          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>Pending Review</h2>
                <p>Vouchers waiting for your decision.</p>
              </div>
              <button
                className="secondary-button"
                onClick={() => setStatusFilter("PENDING_APPROVAL")}
              >
                Show Pending
              </button>
            </div>
            <p>
              To approve, select a pending voucher, enter your signature, and confirm.
              To reject, provide a reason.
            </p>
          </section>
        )}

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>
                {isEmployee
                  ? "My Expense Vouchers"
                  : isDirector
                    ? "All Expense Vouchers"
                    : "Expense Records"}
              </h2>
              <p>
                {isEmployee
                  ? "Your vouchers from the database."
                  : "Records retrieved from the database."}
              </p>
            </div>
            <button className="secondary-button" onClick={loadVouchers} disabled={loading}>
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          <div className="search-box">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search voucher, employee, department, or status..."
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter by status"
            >
              <option value="ALL">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {loading && vouchers.length === 0 ? (
            <p>Loading vouchers...</p>
          ) : filteredVouchers.length === 0 ? (
            <p>No vouchers found.</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>VOUCHER NUMBER</th>
                    {!isEmployee && <th>EMPLOYEE</th>}
                    <th>EXPENSE TITLE</th>
                    <th>DEPARTMENT</th>
                    <th>EXPENSE DATE</th>
                    <th>AMOUNT</th>
                    <th>STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVouchers.map((voucher) => (
                    <tr key={voucher.id}>
                      <td>{voucher.voucher_number}</td>
                      {!isEmployee && (
                        <td>
                          {voucher.employee_name || "—"}
                          <br />
                          <small>{voucher.employee_email || ""}</small>
                        </td>
                      )}
                      <td>{voucher.expense_title}</td>
                      <td>{voucher.department}</td>
                      <td>{formatDate(voucher.expense_date)}</td>
                      <td>{formatAmount(voucher.amount)}</td>
                      <td>
                        <span className={`status ${String(voucher.status).toLowerCase()}`}>
                          {String(voucher.status || "").replaceAll("_", " ")}
                        </span>
                      </td>
                      <td>
                        {isEmployee && voucher.status === "DRAFT" ? (
                          <div className="action-buttons">
                            <button
                              className="secondary-button"
                              onClick={() => openEditForm(voucher)}
                            >
                              Edit
                            </button>
                            <button
                              className="secondary-button"
                              onClick={() => deleteVoucher(voucher)}
                            >
                              Delete
                            </button>
                            <button
                              className="primary-button"
                              onClick={() => submitVoucher(voucher)}
                              disabled={!voucher.employee_signature?.trim()}
                            >
                              Submit
                            </button>
                          </div>
                        ) : isDirector && voucher.status === "PENDING_APPROVAL" ? (
                          <button
                            className="primary-button"
                            onClick={() => {
                              setSelectedVoucher(voucher);
                              setDirectorSignature("");
                              setRejectionReason("");
                              setError("");
                            }}
                          >
                            Review
                          </button>
                        ) : (
                          <button
                            className="secondary-button"
                            onClick={() => setSelectedVoucher(voucher)}
                          >
                            View
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {selectedVoucher && (
          <section className="panel detail-panel">
            <div className="panel-header">
              <div>
                <h2>Voucher Details</h2>
                <p>{selectedVoucher.voucher_number}</p>
              </div>
              <button
                className="secondary-button"
                onClick={() => setSelectedVoucher(null)}
              >
                Close
              </button>
            </div>

            <div className="form-grid">
              <Detail label="Employee" value={selectedVoucher.employee_name || user.full_name} />
              <Detail label="Employee Email" value={selectedVoucher.employee_email || user.email} />
              <Detail label="Department" value={selectedVoucher.department} />
              <Detail label="Expense" value={selectedVoucher.expense_title} />
              <Detail label="Category" value={selectedVoucher.expense_category} />
              <Detail label="Amount" value={formatAmount(selectedVoucher.amount)} />
              <Detail label="Voucher Date" value={formatDate(selectedVoucher.voucher_date)} />
              <Detail label="Expense Date" value={formatDate(selectedVoucher.expense_date)} />
              <Detail label="Employee Signature" value={selectedVoucher.employee_signature} />
              <Detail label="Director Signature" value={selectedVoucher.director_signature} />
              <Detail label="Approval Date" value={selectedVoucher.approval_date ? String(selectedVoucher.approval_date).replace("T", " ").slice(0, 19) : "—"} />
              <Detail label="Rejection Reason" value={selectedVoucher.rejection_reason} />
              <Detail label="Description" value={selectedVoucher.expense_description} wide />
            </div>

            {isDirector && selectedVoucher.status === "PENDING_APPROVAL" && (
              <div className="voucher-form">
                <label htmlFor="directorSignature">Director Signature *</label>
                <input
                  id="directorSignature"
                  value={directorSignature}
                  onChange={(event) => setDirectorSignature(event.target.value)}
                  placeholder="Type your full name as signature"
                />

                <button
                  className="primary-button"
                  onClick={() => approveVoucher(selectedVoucher)}
                >
                  Approve Voucher
                </button>

                <label htmlFor="rejectionReason">Reason for Rejection *</label>
                <textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(event) => setRejectionReason(event.target.value)}
                  rows="3"
                  placeholder="Explain why this voucher is rejected"
                />

                <button
                  className="secondary-button"
                  onClick={() => rejectVoucher(selectedVoucher)}
                >
                  Reject Voucher
                </button>
              </div>
            )}
          </section>
        )}

        <p className="footer">ExpenseFlow · Expense Voucher Management System</p>
      </main>
    </div>
  );
}

function Field({ label, children, wide }) {
  return (
    <div className={wide ? "full-width" : ""}>
      <label>{label}</label>
      {children}
    </div>
  );
}

function Detail({ label, value, wide }) {
  return (
    <div className={wide ? "full-width" : ""}>
      <strong>{label}</strong>
      <p>{value || "—"}</p>
    </div>
  );
}

function StatCard({ title, value, description, icon }) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span>{title}</span>
        <span className="stat-icon">{icon}</span>
      </div>
      <h2>{value}</h2>
      <p>{description}</p>
    </div>
  );
}

export default App;