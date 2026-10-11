import { useEffect, useState } from "react";
import api from "./api";
import "./App.css";

const emptyVoucher = {
  voucher_date: new Date().toISOString().slice(0, 10),
  expense_date: new Date().toISOString().slice(0, 10),
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
  const [form, setForm] = useState(emptyVoucher);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

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
    if (!user || user.role !== "EMPLOYEE") return;

    setLoading(true);
    setError("");

    try {
      const response = await api.get("/vouchers/my");
      setVouchers(response.data.vouchers || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load vouchers. Please log in again if your session expired."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user?.role === "EMPLOYEE") {
      loadVouchers();
    }
    // loadVouchers is intentionally called when the logged-in user changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.role]);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
    setVouchers([]);
    setMessage("");
    setError("");
  }

  function openCreateForm() {
    setEditingId(null);
    setForm({
      ...emptyVoucher,
      department: user.department || "",
    });
    setShowForm(true);
    setMessage("");
    setError("");
  }

  function openEditForm(voucher) {
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

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
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

    const payload = {
      ...form,
      amount,
    };

    setLoading(true);

    try {
      if (editingId) {
        const response = await api.put(
          `/vouchers/${editingId}`,
          payload
        );

        setMessage(response.data.message || "Draft updated successfully.");
      } else {
        const response = await api.post("/vouchers", payload);

        setMessage(
          response.data.message || "Draft voucher created successfully."
        );
      }

      setShowForm(false);
      setEditingId(null);
      setForm(emptyVoucher);

      await loadVouchers();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to save the voucher."
      );
    } finally {
      setLoading(false);
    }
  }

  async function deleteVoucher(voucher) {
    const confirmed = window.confirm(
      `Delete draft ${voucher.voucher_number}?`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      const response = await api.delete(`/vouchers/${voucher.id}`);

      setMessage(response.data.message || "Draft deleted successfully.");
      await loadVouchers();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to delete this draft."
      );
    }
  }

  async function submitVoucher(voucher) {
    if (!voucher.employee_signature?.trim()) {
      setError(
        `Please edit ${voucher.voucher_number} and enter your signature before submitting.`
      );
      return;
    }

    const confirmed = window.confirm(
      `Submit ${voucher.voucher_number} to the Director for approval?`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      const response = await api.patch(
        `/vouchers/${voucher.id}/submit`
      );

      setMessage(response.data.message || "Voucher submitted successfully.");
      await loadVouchers();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to submit the voucher. Check that your signature is saved."
      );
    }
  }

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
              required
            />

            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
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

  const filteredVouchers = vouchers.filter((voucher) => {
    const query = search.toLowerCase();

    return (
      String(voucher.voucher_number || "").toLowerCase().includes(query) ||
      String(voucher.expense_title || "").toLowerCase().includes(query) ||
      String(voucher.status || "").toLowerCase().includes(query)
    );
  });

  const countStatus = (status) =>
    vouchers.filter((voucher) => voucher.status === status).length;

  const formatAmount = (amount) =>
    Number(amount).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
    });

  const formatDate = (date) => {
    if (!date) return "—";

    const value = String(date).slice(0, 10);
    return value;
  };

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
            <p>{user.role}</p>
          </div>

          <button className="secondary-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="content">
        <div className="welcome">
          <div>
            <p className="eyebrow">EMPLOYEE PORTAL</p>
            <h1>Employee Dashboard</h1>
            <p className="subtitle">
              Create, manage, and track your expense vouchers.
            </p>
          </div>

          <button className="primary-button" onClick={openCreateForm}>
            + Create Voucher
          </button>
        </div>

        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}

        <div className="stats-grid">
          <StatCard
            title="Total Vouchers"
            value={vouchers.length}
            description="Your recorded vouchers"
            icon="▤"
          />

          <StatCard
            title="Draft"
            value={countStatus("DRAFT")}
            description="Not yet submitted"
            icon="✎"
          />

          <StatCard
            title="Pending Approval"
            value={countStatus("PENDING_APPROVAL")}
            description="Awaiting Director review"
            icon="◷"
          />

          <StatCard
            title="Approved"
            value={countStatus("APPROVED")}
            description="Successfully approved"
            icon="✓"
          />
        </div>

        {showForm && (
          <section className="panel voucher-form-panel">
            <div className="panel-header">
              <div>
                <h2>{editingId ? "Edit Draft Voucher" : "Create Voucher"}</h2>
                <p>
                  {editingId
                    ? "Update the details of your draft."
                    : "Complete the details and save your voucher as a draft."}
                </p>
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
                <div>
                  <label htmlFor="voucher_date">Voucher Date *</label>
                  <input
                    id="voucher_date"
                    name="voucher_date"
                    type="date"
                    value={form.voucher_date}
                    onChange={updateField}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="expense_date">Expense Date *</label>
                  <input
                    id="expense_date"
                    name="expense_date"
                    type="date"
                    value={form.expense_date}
                    onChange={updateField}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="department">Department *</label>
                  <input
                    id="department"
                    name="department"
                    value={form.department}
                    onChange={updateField}
                    placeholder="e.g. Engineering"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="expense_title">Expense Title *</label>
                  <input
                    id="expense_title"
                    name="expense_title"
                    value={form.expense_title}
                    onChange={updateField}
                    placeholder="e.g. Office Travel"
                    maxLength={200}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="expense_category">Expense Category</label>
                  <select
                    id="expense_category"
                    name="expense_category"
                    value={form.expense_category}
                    onChange={updateField}
                  >
                    <option value="">Select a category</option>
                    <option value="Travel">Travel</option>
                    <option value="Meals">Meals</option>
                    <option value="Accommodation">Accommodation</option>
                    <option value="Office Supplies">Office Supplies</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="amount">Amount (₹) *</label>
                  <input
                    id="amount"
                    name="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.amount}
                    onChange={updateField}
                    placeholder="Enter amount"
                    required
                  />
                </div>

                <div className="full-width">
                  <label htmlFor="expense_description">
                    Expense Description
                  </label>
                  <textarea
                    id="expense_description"
                    name="expense_description"
                    value={form.expense_description}
                    onChange={updateField}
                    placeholder="Explain the expense..."
                    rows="3"
                  />
                </div>

                <div className="full-width">
                  <label htmlFor="employee_signature">
                    Employee Signature *
                  </label>
                  <input
                    id="employee_signature"
                    name="employee_signature"
                    value={form.employee_signature}
                    onChange={updateField}
                    placeholder="Type your full name as signature"
                    required
                  />
                  <small>
                    This text signature is for the current prototype. Image
                    signature uploads can be added separately.
                  </small>
                </div>
              </div>

              <button className="primary-button" type="submit" disabled={loading}>
                {loading
                  ? "Saving..."
                  : editingId
                    ? "Save Changes"
                    : "Save Draft"}
              </button>
            </form>
          </section>
        )}

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>My Expense Vouchers</h2>
              <p>Voucher records loaded from the database.</p>
            </div>

            <button className="secondary-button" onClick={loadVouchers}>
              Refresh
            </button>
          </div>

          <div className="search-box">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search voucher number, title, or status..."
            />
          </div>

          {loading && vouchers.length === 0 ? (
            <p>Loading your vouchers...</p>
          ) : filteredVouchers.length === 0 ? (
            <p>No vouchers found. Click “Create Voucher” to get started.</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>VOUCHER NUMBER</th>
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
                      <td>{voucher.expense_title}</td>
                      <td>{voucher.department}</td>
                      <td>{formatDate(voucher.expense_date)}</td>
                      <td>{formatAmount(voucher.amount)}</td>
                      <td>
                        <span
                          className={`status ${String(
                            voucher.status
                          ).toLowerCase()}`}
                        >
                          {voucher.status.replaceAll("_", " ")}
                        </span>
                      </td>
                      <td>
                        {voucher.status === "DRAFT" ? (
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
                              title={
                                voucher.employee_signature?.trim()
                                  ? "Submit for approval"
                                  : "Add your signature before submitting"
                              }
                            >
                              Submit
                            </button>
                          </div>
                        ) : (
                          <span>View only</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="footer">
          ExpenseFlow · Expense Voucher Management System
        </p>
      </main>
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