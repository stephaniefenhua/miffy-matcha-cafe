import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import Button from "./components/Button";
import StatusBadge from "./components/StatusBadge";
import { ORDER_STATUS } from "./components/StatusBadge";
import EditDrinkModal from "./components/EditDrinkModal";
import AddDrinkForm from "./components/AddDrinkForm";
import AdminDrinkCard from "./components/AdminDrinkCard";
import OrderCard from "./components/OrderCard";
import ManageUsersSection from "./components/ManageUsersSection";
import LoginForm from "./components/LoginForm";

// Constants
const STYLES = {
  heading: {
    h1: "text-3xl font-bold text-green-900",
    h2: "text-2xl font-bold text-green-800",
  },
  table: {
    header: "px-6 py-3 text-left text-sm font-semibold text-gray-700",
    cell: "px-6 py-4 text-gray-800",
    cellSecondary: "px-6 py-4 text-gray-600",
    cellSmall: "px-6 py-4 text-gray-600 text-sm",
  },
  button: {
    primary: "bg-green-700 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-800 transition-all shadow-lg hover:shadow-xl",
    danger: "bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition-all shadow-lg hover:shadow-xl",
    nav: "bg-green-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-800 transition-all shadow-lg hover:shadow-xl",
  },
};

// Utility Functions
const handleError = (error, message) => {
  console.error(message, error);
  alert(`${message}. Check console for details.`);
};

const formatTimestamp = (timestamp) => {
  if (!timestamp) return "-";
  const date = new Date(timestamp);
  return date.toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

export default function AdminPage() {
  // Auth state
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Data state
  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [drinks, setDrinks] = useState([]);
  const [approvedUsers, setApprovedUsers] = useState([]);

  // Form state
  const [newUserName, setNewUserName] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [showAddDrink, setShowAddDrink] = useState(false);
  const [newDrink, setNewDrink] = useState({
    name: "",
    description: "",
    is_available: true,
  });

  // Modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editModalDrink, setEditModalDrink] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: "", description: "" });

  // Authentication
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      alert(error.message);
    } else {
      setEmail("");
      setPassword("");
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  // Data loading functions
  async function loadOrders() {
    const { data, error } = await supabase
      .from("orders")
      .select("*, drinks(name)")
      .in("status", [ORDER_STATUS.PENDING, ORDER_STATUS.IN_PROGRESS])
      .order("created_at", { ascending: true });

    if (error) {
      handleError(error, "Error loading live orders");
      return;
    }
    setOrders(data || []);
  }

  async function loadAllOrders() {
    const { data, error } = await supabase
      .from("orders")
      .select("*, drinks(name)")
      .order("created_at", { ascending: false });

    if (error) {
      handleError(error, "Error loading all orders");
      return;
    }
    setAllOrders(data || []);
  }

  async function loadDrinks() {
    const { data, error } = await supabase
      .from("drinks")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      handleError(error, "Error loading drinks");
      return;
    }
    setDrinks(data || []);
  }

  async function loadUsers() {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      handleError(error, "Error loading users");
      return;
    }
    setApprovedUsers(data || []);
  }

  // Order management
  async function updateStatus(id, status) {
    const updateData = { status };

    if (status === ORDER_STATUS.IN_PROGRESS) {
      updateData.started_at = new Date().toISOString();
    } else if (status === ORDER_STATUS.COMPLETE) {
      updateData.completed_at = new Date().toISOString();
    }

    const { error } = await supabase.from("orders").update(updateData).eq("id", id);

    if (error) {
      handleError(error, "Failed to update order status");
      return;
    }

    loadOrders();
    loadAllOrders();
  }

  async function clearAllOrders() {
    const confirmed = window.confirm(
      "Are you sure you want to delete ALL orders? This will delete all orders from the database and cannot be undone!"
    );

    if (!confirmed) return;

    const { error } = await supabase.from("orders").delete().neq("id", 0);

    if (error) {
      handleError(error, "Failed to clear orders");
      return;
    }

    loadOrders();
    loadAllOrders();
  }

  // Drink management
  async function addDrink() {
    if (!newDrink.name.trim()) {
      alert("Please enter a drink name.");
      return;
    }

    const drinkData = {
      name: newDrink.name.trim(),
      description: newDrink.description.trim() || null,
      is_available: newDrink.is_available,
    };

    const { error } = await supabase.from("drinks").insert(drinkData);

    if (error) {
      handleError(error, "Failed to add drink");
      return;
    }

    setNewDrink({ name: "", description: "", is_available: true });
    setShowAddDrink(false);
    loadDrinks();
  }

  async function deleteDrink(id, name) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${name}"? This cannot be undone!`
    );

    if (!confirmed) return;

    const { error } = await supabase.from("drinks").delete().eq("id", id);

    if (error) {
      handleError(error, "Failed to delete drink");
      return;
    }

    loadDrinks();
  }

  async function toggleAvailability(id, currentStatus) {
    const { error } = await supabase
      .from("drinks")
      .update({ is_available: !currentStatus })
      .eq("id", id);

    if (error) {
      handleError(error, "Failed to update availability");
      return;
    }

    loadDrinks();
  }

  function openEditModal(drink) {
    setEditModalDrink(drink);
    setEditFormData({
      name: drink.name,
      description: drink.description || "",
    });
    setShowEditModal(true);
  }

  function closeEditModal() {
    setShowEditModal(false);
    setEditModalDrink(null);
    setEditFormData({ name: "", description: "" });
  }

  async function saveDrinkEdit() {
    if (!editFormData.name.trim()) {
      alert("Drink name cannot be empty!");
      return;
    }

    const { error } = await supabase
      .from("drinks")
      .update({
        name: editFormData.name.trim(),
        description: editFormData.description.trim() || null,
      })
      .eq("id", editModalDrink.id);

    if (error) {
      handleError(error, "Failed to update drink");
      return;
    }

    closeEditModal();
    loadDrinks();
    loadOrders();
  }

  // User management
  async function addUser() {
    if (!newUserName.trim()) {
      alert("Please enter a name");
      return;
    }

    const { error } = await supabase.from("users").insert({ name: newUserName.trim() });

    if (error) {
      if (error.code === "23505") {
        alert("This name already exists!");
      } else {
        handleError(error, "Failed to add user");
      }
      return;
    }

    setNewUserName("");
    loadUsers();
  }

  async function deleteUser(id) {
    if (!confirm("Are you sure you want to remove this user?")) return;

    const { error } = await supabase.from("users").delete().eq("id", id);

    if (error) {
      handleError(error, "Failed to delete user");
      return;
    }

    loadUsers();
  }

  // Realtime updates
  useEffect(() => {
    if (!user) return;

    loadOrders();
    loadAllOrders();
    loadDrinks();
    loadUsers();

    const ordersChannel = supabase
      .channel("orders-admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        loadOrders();
        loadAllOrders();
      })
      .subscribe();

    const drinksChannel = supabase
      .channel("drinks")
      .on("postgres_changes", { event: "*", schema: "public", table: "drinks" }, loadDrinks)
      .subscribe();

    const usersChannel = supabase
      .channel("users-admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "users" }, loadUsers)
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(drinksChannel);
      supabase.removeChannel(usersChannel);
    };
  }, [user]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-2xl text-gray-600">loading...</div>
      </div>
    );
  }

  // Login form
  if (!user) {
    return (
      <LoginForm
        email={email}
        password={password}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onSubmit={handleLogin}
      />
    );
  }

  // Main dashboard
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className={`${STYLES.heading.h1} mb-8`}>Admin Dashboard</h1>

        {/* Live Orders Section */}
        <div className="mb-12">
          <h2 className={`${STYLES.heading.h2} mb-6`}>Live Orders</h2>
          {orders.length === 0 ? (
            <p className="text-center text-gray-600 text-lg">No orders yet.</p>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} onUpdateStatus={updateStatus} />
              ))}
            </div>
          )}
        </div>

        {/* Drinks Management Section */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className={STYLES.heading.h2}>Manage Drinks</h2>
            <button
              onClick={() => setShowAddDrink(!showAddDrink)}
              className={STYLES.button.primary}
            >
              {showAddDrink ? "Cancel" : "Add New Drink"}
            </button>
          </div>

          {showAddDrink && (
            <AddDrinkForm
              drink={newDrink}
              onDrinkChange={setNewDrink}
              onAdd={addDrink}
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {drinks.map((drink) => (
              <AdminDrinkCard
                key={drink.id}
                drink={drink}
                onEdit={openEditModal}
                onToggleAvailability={toggleAvailability}
                onDelete={deleteDrink}
              />
            ))}
          </div>
        </div>

        {/* Manage Users Section */}
        <ManageUsersSection
          users={approvedUsers}
          searchQuery={userSearchQuery}
          newUserName={newUserName}
          onSearchChange={setUserSearchQuery}
          onNewNameChange={setNewUserName}
          onAddUser={addUser}
          onDeleteUser={deleteUser}
        />

        {/* All Orders Section */}
        <div className="mt-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className={STYLES.heading.h2}>All Orders</h2>
            {allOrders.length > 0 && (
              <button onClick={clearAllOrders} className={STYLES.button.danger}>
                Clear All Orders
              </button>
            )}
          </div>

          {allOrders.length === 0 ? (
            <p className="text-center text-gray-600 text-lg">No orders in the database.</p>
          ) : (
            <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      <th className={STYLES.table.header}>Name</th>
                      <th className={STYLES.table.header}>Order</th>
                      <th className={STYLES.table.header}>Size</th>
                      <th className={STYLES.table.header}>Created</th>
                      <th className={STYLES.table.header}>Started</th>
                      <th className={STYLES.table.header}>Completed</th>
                      <th className={STYLES.table.header}>Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {allOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                        <td className={STYLES.table.cell}>{order.customer_name}</td>
                        <td className={STYLES.table.cell}>{order.drinks.name}</td>
                        <td className={STYLES.table.cellSecondary}>{order.size || "-"}</td>
                        <td className={STYLES.table.cellSmall}>{formatTimestamp(order.created_at)}</td>
                        <td className={STYLES.table.cellSmall}>{formatTimestamp(order.started_at)}</td>
                        <td className={STYLES.table.cellSmall}>{formatTimestamp(order.completed_at)}</td>
                        <td className="px-6 py-4">
                          <StatusBadge status={order.status} className="text-xs" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Navigation and Logout */}
        <div className="mt-12 flex justify-center gap-4">
          <a href="/" className={STYLES.button.nav}>
            back to order page
          </a>
          <button onClick={handleLogout} className={STYLES.button.danger}>
            logout
          </button>
        </div>
      </div>

      {/* Edit Drink Modal */}
      {showEditModal && editModalDrink && (
        <EditDrinkModal
          drink={editModalDrink}
          formData={editFormData}
          onClose={closeEditModal}
          onSave={saveDrinkEdit}
          onFormChange={setEditFormData}
        />
      )}
    </div>
  );
}
