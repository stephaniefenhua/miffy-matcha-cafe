import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [drinks, setDrinks] = useState([]);
  const [showAddDrink, setShowAddDrink] = useState(false);
  const [editingDrink, setEditingDrink] = useState(null);
  const [editDescription, setEditDescription] = useState("");
  const [editingName, setEditingName] = useState(null);
  const [editName, setEditName] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editModalDrink, setEditModalDrink] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: "", description: "" });
  const [newDrink, setNewDrink] = useState({
    name: "",
    description: "",
    is_available: true,
  });

  // Check if already authenticated on mount
  useEffect(() => {
    const authStatus = localStorage.getItem("admin_authenticated");
    if (authStatus === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  // Handle login
  function handleLogin(e) {
    e.preventDefault();
    const correctPassword = import.meta.env.VITE_ADMIN_PASSWORD;
    
    if (password === correctPassword) {
      setIsAuthenticated(true);
      localStorage.setItem("admin_authenticated", "true");
      setPassword("");
    } else {
      alert("Incorrect password");
      setPassword("");
    }
  }

  // Handle logout
  function handleLogout() {
    setIsAuthenticated(false);
    localStorage.removeItem("admin_authenticated");
  }

  // Format status for display
  function formatStatus(status) {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
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
        description: editFormData.description.trim() || null
      })
      .eq("id", editModalDrink.id);

    if (error) {
      console.error("Error updating drink:", error);
      alert("Failed to update drink. Check console for details.");
      return;
    }

    closeEditModal();
    loadDrinks();
    loadOrders(); // Refresh to show updated drink names
  }

  // Load all orders
  async function loadOrders() {
    const { data, error } = await supabase
      .from("orders")
      .select("*, drinks(name)")
      .in("status", ["pending", "in_progress"])
      .order("created_at", { ascending: true });
    
    if (error) {
      console.error("Error loading live orders:", error);
    }
    setOrders(data || []);
  }

  // Load all orders (for the manage all orders section)
  async function loadAllOrders() {
    const { data, error } = await supabase
      .from("orders")
      .select("*, drinks(name)")
      .order("created_at", { ascending: false }); // Most recent first
    
    if (error) {
      console.error("Error loading all orders:", error);
    }
    setAllOrders(data || []);
  }

  // Load all drinks
  async function loadDrinks() {
    const { data } = await supabase
      .from("drinks")
      .select("*")
      .order("name", { ascending: true });
    setDrinks(data);
  }

  // Update order status
  async function updateStatus(id, status) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    
    if (error) {
      console.error("Error updating order status:", error);
      alert("Failed to update order status. Check console for details.");
      return;
    }
    
    loadOrders(); // refresh live orders
    loadAllOrders(); // refresh all orders table
  }

  // Clear all orders
  async function clearAllOrders() {
    const confirmed = window.confirm(
      "Are you sure you want to delete ALL orders? This will delete all orders from the database and cannot be undone!"
    );
    if (confirmed) {
      await supabase.from("orders").delete().neq("id", 0); // Delete all rows
      loadOrders(); // refresh live orders
      loadAllOrders(); // refresh all orders table
    }
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

    const { error } = await supabase.from("drinks").insert(drinkData);
    
    if (error) {
      console.error("Error adding drink:", error);
      alert("Failed to add drink. Please check your permissions.");
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
    if (confirmed) {
      await supabase.from("drinks").delete().eq("id", id);
      loadDrinks();
    }
  }

  // Toggle drink availability
  async function toggleAvailability(id, currentStatus) {
    await supabase
      .from("drinks")
      .update({ is_available: !currentStatus })
      .eq("id", id);
    loadDrinks();
  }

  // Start editing description
  function startEditDescription(drink) {
    setEditingDrink(drink.id);
    setEditDescription(drink.description || "");
  }

  // Cancel editing
  function cancelEditDescription() {
    setEditingDrink(null);
    setEditDescription("");
  }

  // Update drink description
  async function updateDescription(id) {
    const { error } = await supabase
      .from("drinks")
      .update({ description: editDescription || null })
      .eq("id", id);
    
    if (error) {
      console.error("Error updating description:", error);
      alert("Failed to update description. Check console for details.");
      return;
    }
    
    setEditingDrink(null);
    setEditDescription("");
    loadDrinks();
  }

  // Start editing name
  function startEditName(drink) {
    setEditingName(drink.id);
    setEditName(drink.name);
  }

  // Cancel editing name
  function cancelEditName() {
    setEditingName(null);
    setEditName("");
  }

  // Update drink name
  async function updateName(id) {
    if (!editName.trim()) {
      alert("Drink name cannot be empty!");
      return;
    }

    const { error } = await supabase
      .from("drinks")
      .update({ name: editName.trim() })
      .eq("id", id);
    
    if (error) {
      console.error("Error updating name:", error);
      alert("Failed to update name. Check console for details.");
      return;
    }
    
    setEditingName(null);
    setEditName("");
    loadDrinks();
    loadOrders(); // Refresh orders to show updated drink names
  }

  // Realtime updates
  useEffect(() => {
    if (!isAuthenticated) return;

    loadOrders();
    loadAllOrders();
    loadDrinks();

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

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(drinksChannel);
    };
  }, [isAuthenticated]);

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-green-900 mb-6 text-center">admin login</h1>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 border-4 border-gray-200 rounded-xl text-lg mb-4 focus:outline-none focus:border-green-600 transition"
              autoFocus
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
        <h1 className="text-3xl font-bold text-green-900 mb-8">Admin Dashboard</h1>

        {/* Orders Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-green-800 mb-6">Live Orders</h2>

          {orders.length === 0 && (
            <p className="text-center text-gray-600 text-lg">No orders yet.</p>
          )}

          <div className="space-y-4">
            {orders.map((o) => (
              <div
                key={o.id}
                className="bg-white p-6 rounded-xl shadow-lg border-2 border-gray-200"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <p className="text-xl font-bold text-gray-800">{o.customer_name}</p>
                  <p className="text-lg text-gray-600">
                    {o.drinks.name}
                    {o.size && <span className="text-sm text-gray-500"> ({o.size})</span>}
                  </p>
                  <span
                      className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-semibold ${
                        o.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : o.status === "in_progress"
                          ? "bg-blue-100 text-blue-800"
                          : o.status === "cancelled"
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {formatStatus(o.status)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {o.status === "pending" && (
                      <button
                        onClick={() => updateStatus(o.id, "in_progress")}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-all"
                      >
                        Start
                      </button>
                    )}
                    <button
                      onClick={() => updateStatus(o.id, "complete")}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-all"
                    >
                      Complete
                    </button>
                    <button
                      onClick={() => updateStatus(o.id, "cancelled")}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
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
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Order</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Size</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {allOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-gray-800">{order.customer_name}</td>
                        <td className="px-6 py-4 text-gray-800">{order.drinks.name}</td>
                        <td className="px-6 py-4 text-gray-600">{order.size || '-'}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                              order.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : order.status === "in_progress"
                                ? "bg-blue-100 text-blue-800"
                                : order.status === "cancelled"
                                ? "bg-red-100 text-red-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {formatStatus(order.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <div className="mt-12 flex justify-center">
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
