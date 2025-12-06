import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import Button from "./components/Button";
import Card from "./components/Card";
import StatusBadge, { ORDER_STATUS } from "./components/StatusBadge";

// Reusable Style Classes
const STYLES = {
  input: "w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-200",
  inputLarge: "w-full p-4 border-4 border-gray-200 rounded-xl text-lg focus:outline-none focus:border-green-600 transition",
  heading: {
    h1: "text-3xl font-bold text-green-900",
    h2: "text-2xl font-bold text-green-800",
    h3: "text-xl font-bold text-gray-800",
  },
  table: {
    header: "px-6 py-3 text-left text-sm font-semibold text-gray-700",
    cell: "px-6 py-4 text-gray-800",
    cellSecondary: "px-6 py-4 text-gray-600",
    cellSmall: "px-6 py-4 text-gray-600 text-sm",
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
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [drinks, setDrinks] = useState([]);
  const [approvedUsers, setApprovedUsers] = useState([]);
  const [newUserName, setNewUserName] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [showAddDrink, setShowAddDrink] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editModalDrink, setEditModalDrink] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: "", description: "" });
  const [newDrink, setNewDrink] = useState({
    name: "",
    description: "",
    is_available: true,
  });

  // Check authentication on mount
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

  // Handle login
  async function handleLogin(e) {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    } else {
      setEmail("");
      setPassword("");
    }
  }

  // Handle logout
  async function handleLogout() {
    await supabase.auth.signOut();
  }

  // Open edit modal
  function openEditModal(drink) {
    setEditModalDrink(drink);
    setEditFormData({
      name: drink.name,
      description: drink.description || ""
    });
    setShowEditModal(true);
  }

  // Close edit modal
  function closeEditModal() {
    setShowEditModal(false);
    setEditModalDrink(null);
    setEditFormData({ name: "", description: "" });
  }

  // Save drink edits from modal
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

  // Load orders with optional filtering
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

  // Load all drinks
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

  // Load approved users
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

  // Add new user
  async function addUser() {
    if (!newUserName.trim()) {
      alert("Please enter a name");
      return;
    }

    const { error } = await supabase
      .from("users")
      .insert({ name: newUserName.trim() });

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

  // Delete user
  async function deleteUser(id) {
    if (!confirm("Are you sure you want to remove this user?")) return;

    const { error } = await supabase.from("users").delete().eq("id", id);

    if (error) {
      handleError(error, "Failed to delete user");
      return;
    }

    loadUsers();
  }

  // Update order status with timestamps
  async function updateStatus(id, status) {
    const updateData = { status };
    
    // Add timestamps based on status
    if (status === ORDER_STATUS.IN_PROGRESS) {
      updateData.started_at = new Date().toISOString();
    } else if (status === ORDER_STATUS.COMPLETE) {
      updateData.completed_at = new Date().toISOString();
    }
    
    const { error } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", id);
    
    if (error) {
      handleError(error, "Failed to update order status");
      return;
    }
    
    loadOrders();
    loadAllOrders();
  }

  // Clear all orders
  async function clearAllOrders() {
    const confirmed = window.confirm(
      "Are you sure you want to delete ALL orders? This will delete all orders from the database and cannot be undone!"
    );
    
    if (!confirmed) return;
    
    const { error } = await supabase
      .from("orders")
      .delete()
      .neq("id", 0);
    
    if (error) {
      handleError(error, "Failed to clear orders");
      return;
    }
    
    loadOrders();
    loadAllOrders();
  }

  // Add new drink
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

    const { error } = await supabase
      .from("drinks")
      .insert(drinkData);
    
    if (error) {
      handleError(error, "Failed to add drink");
      return;
    }
    
    setNewDrink({ name: "", description: "", is_available: true });
    setShowAddDrink(false);
    loadDrinks();
  }

  // Delete drink
  async function deleteDrink(id, name) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${name}"? This cannot be undone!`
    );
    
    if (!confirmed) return;
    
    const { error } = await supabase
      .from("drinks")
      .delete()
      .eq("id", id);
    
    if (error) {
      handleError(error, "Failed to delete drink");
      return;
    }
    
    loadDrinks();
  }

  // Toggle drink availability
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


  // Realtime updates
  useEffect(() => {
    if (!user) return;

    loadOrders();
    loadAllOrders();
    loadDrinks();
    loadUsers();

    const ordersChannel = supabase
      .channel("orders-admin")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          loadOrders();
          loadAllOrders();
        }
      )
      .subscribe();

    const drinksChannel = supabase
      .channel("drinks")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "drinks" },
        () => loadDrinks()
      )
      .subscribe();

    const usersChannel = supabase
      .channel("users-admin")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "users" },
        () => loadUsers()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(drinksChannel);
      supabase.removeChannel(usersChannel);
    };
  }, [user]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-2xl text-gray-600">loading...</div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-green-900 mb-6 text-center">admin login</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              placeholder="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 border-4 border-gray-200 rounded-xl text-lg focus:outline-none focus:border-green-600 transition"
              required
              autoFocus
            />
            <input
              type="password"
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 border-4 border-gray-200 rounded-xl text-lg focus:outline-none focus:border-green-600 transition"
              required
            />
            <button
              type="submit"
              className="w-full bg-green-700 text-white p-4 rounded-xl text-lg font-bold hover:bg-green-800 transition-all transform hover:scale-105"
            >
              login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className={`${STYLES.heading.h1} mb-8`}>Admin Dashboard</h1>

        {/* Orders Section */}
        <div className="mb-12">
          <h2 className={`${STYLES.heading.h2} mb-6`}>Live Orders</h2>

          {orders.length === 0 && (
            <p className="text-center text-gray-600 text-lg">No orders yet.</p>
          )}

          <div className="space-y-4">
            {orders.map((o) => (
              <Card key={o.id}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-xl font-bold text-gray-800">{o.customer_name}</p>
                    <p className="text-lg text-gray-600">
                      {o.drinks.name}
                      {o.size && <span className="text-sm text-gray-500"> ({o.size})</span>}
                    </p>
                    <StatusBadge status={o.status} />
                  </div>
                  <div className="flex gap-2">
                    {o.status === ORDER_STATUS.PENDING && (
                      <Button onClick={() => updateStatus(o.id, ORDER_STATUS.IN_PROGRESS)} variant="secondary">
                        Start
                      </Button>
                    )}
                    <Button onClick={() => updateStatus(o.id, ORDER_STATUS.COMPLETE)} variant="primary" className="bg-green-600 hover:bg-green-700">
                      Complete
                    </Button>
                    <Button onClick={() => updateStatus(o.id, ORDER_STATUS.CANCELLED)} variant="danger">
                      Cancel
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Drinks Management Section */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-green-800">Manage Drinks</h2>
            <button
              onClick={() => setShowAddDrink(!showAddDrink)}
              className="bg-green-700 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-800 transition-all shadow-lg hover:shadow-xl"
            >
              {showAddDrink ? "Cancel" : "Add New Drink"}
            </button>
          </div>

          {/* Add Drink Form */}
          {showAddDrink && (
            <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-green-200 mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Add New Drink</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Drink Name *
                  </label>
                  <input
                    type="text"
                    value={newDrink.name}
                    onChange={(e) => setNewDrink({ ...newDrink, name: e.target.value })}
                    placeholder="e.g., Matcha Latte"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newDrink.description}
                    onChange={(e) => setNewDrink({ ...newDrink, description: e.target.value })}
                    placeholder="e.g., Creamy matcha with oat milk"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-200"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_available"
                    checked={newDrink.is_available}
                    onChange={(e) => setNewDrink({ ...newDrink, is_available: e.target.checked })}
                    className="w-5 h-5"
                  />
                  <label htmlFor="is_available" className="text-sm font-semibold text-gray-700">
                    Available for ordering
                  </label>
                </div>
                <button
                  onClick={addDrink}
                  disabled={!newDrink.name}
                  className="w-full bg-green-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Drink
                </button>
              </div>
            </div>
          )}

          {/* Drinks List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {drinks.map((drink) => (
              <div
                key={drink.id}
                className="bg-white p-6 rounded-xl shadow-lg border-2 border-gray-200"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800">{drink.name}</h3>
                    {drink.description ? (
                      <p className="text-sm text-gray-600 mt-1 text-left font-light leading-tight">{drink.description}</p>
                    ) : (
                      <p className="text-sm text-gray-400 italic mt-1">No description</p>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      drink.is_available
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {drink.is_available ? "Available" : "Unavailable"}
                  </span>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => openEditModal(drink)}
                    className="px-4 py-2 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-all"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => toggleAvailability(drink.id, drink.is_available)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      drink.is_available
                        ? "bg-gray-600 hover:bg-gray-700 text-white"
                        : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                  >
                    {drink.is_available ? "Mark Unavailable" : "Mark Available"}
                  </button>
                  <button
                    onClick={() => deleteDrink(drink.id, drink.name)}
                    className="px-4 py-2 rounded-lg font-semibold bg-red-600 text-white hover:bg-red-700 transition-all"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Manage Users Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-green-800 mb-6">Manage Customers</h2>
          
          {/* Search and Add User - Full Width */}
          <div className="flex gap-4 mb-6 items-center w-full">
            <input
              type="text"
              placeholder="🔍 search name"
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              className="p-3 border-4 border-gray-200 rounded-xl text-lg bg-white focus:outline-none transition flex-1"
            />
            <input
              type="text"
              placeholder="enter name to add"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addUser()}
              className="p-3 border-4 border-gray-200 rounded-xl text-lg bg-white focus:outline-none transition flex-1"
            />
            <button
              onClick={addUser}
              className="bg-green-700 text-white w-12 h-12 rounded-xl text-2xl font-bold hover:bg-green-800 transition-all shadow-lg hover:shadow-xl flex items-center justify-center"
            >
              +
            </button>
          </div>

          {/* Users List */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden">
            {approvedUsers.length === 0 ? (
              <p className="text-center text-gray-600 p-6">No approved users yet.</p>
            ) : (
              <>
                <table className="w-full table-fixed">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      <th className={`${STYLES.table.header} w-3/4`}>Name</th>
                      <th className={`${STYLES.table.header} w-1/4`}>Actions</th>
                    </tr>
                  </thead>
                </table>
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full table-fixed">
                    <tbody className="divide-y divide-gray-200">
                      {approvedUsers
                        .filter((u) =>
                          u.name.toLowerCase().includes(userSearchQuery.toLowerCase())
                        )
                        .map((u) => (
                          <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                            <td className={`${STYLES.table.cell} w-3/4`}>{u.name}</td>
                            <td className="px-6 py-4 w-1/4">
                              <button
                                onClick={() => deleteUser(u.id)}
                                className="text-red-600 hover:text-red-800 font-semibold transition-colors"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                {userSearchQuery && approvedUsers.filter((u) =>
                  u.name.toLowerCase().includes(userSearchQuery.toLowerCase())
                ).length === 0 && (
                  <p className="text-center text-gray-500 py-4">No users found matching "{userSearchQuery}"</p>
                )}
              </>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-2">{approvedUsers.length} total users</p>
        </div>

        {/* All Orders Section */}
        <div className="mt-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-green-800">All Orders</h2>
            {allOrders.length > 0 && (
              <button
                onClick={clearAllOrders}
                className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition-all shadow-lg hover:shadow-xl"
              >
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

        {/* Navigation and Logout Buttons */}
        <div className="mt-12 flex justify-center gap-4">
          <a
            href="/"
            className="bg-green-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-800 transition-all shadow-lg hover:shadow-xl"
          >
            back to order page
          </a>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-red-700 transition-all shadow-lg hover:shadow-xl"
          >
            logout
          </button>
        </div>
      </div>

      {/* Edit Drink Modal */}
      {showEditModal && editModalDrink && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)' }}
          onClick={closeEditModal}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border-4 border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Edit Drink</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Drink Name
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-200"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  rows="4"
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-200 text-sm font-light leading-tight text-gray-600"
                  placeholder="Enter drink description..."
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={saveDrinkEdit}
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-all"
              >
                Save Changes
              </button>
              <button
                onClick={closeEditModal}
                className="px-6 py-3 rounded-lg font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
