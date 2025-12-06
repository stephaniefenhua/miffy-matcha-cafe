import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";
import Button from "./components/Button";
import StatusBadge from "./components/StatusBadge";

const STYLES = {
  input: "p-3 border-4 border-gray-200 rounded-xl w-full max-w-sm text-lg bg-white focus:outline-none transition",
  heading: "text-3xl font-bold mb-6 text-green-900",
  table: {
    header: "px-6 py-3 text-left text-sm font-semibold text-gray-700",
    cell: "px-6 py-4 text-gray-800",
    cellSecondary: "px-6 py-4 text-gray-600 text-sm",
  },
};

const formatTime = (timestamp) => {
  if (!timestamp) return "-";
  const date = new Date(timestamp);
  return date.toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const handleError = (error, message) => {
  console.error(message, error);
  alert(`${message}. Please try again.`);
};

export default function OrderStatusPage() {
  const [name, setName] = useState("");
  const [orders, setOrders] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [approvedNames, setApprovedNames] = useState([]);
  const [showNameDropdown, setShowNameDropdown] = useState(false);
  const nameInputRef = useRef(null);

  // Filter approved names based on input
  const filteredNames = name.trim()
    ? approvedNames.filter((n) =>
        n.toLowerCase().startsWith(name.toLowerCase().trim())
      )
    : approvedNames;

  // Load approved users from database
  async function loadApprovedUsers() {
    const { data, error } = await supabase
      .from("users")
      .select("name")
      .order("name");

    if (error) {
      console.error("Error loading users:", error);
      return;
    }

    if (data) {
      setApprovedNames(data.map((user) => user.name));
    }
  }

  // Check for name in URL parameters and auto-search
  useEffect(() => {
    loadApprovedUsers();

    const params = new URLSearchParams(window.location.search);
    const nameFromUrl = params.get("name");
    
    if (nameFromUrl) {
      setName(nameFromUrl);
      // Auto-search with the provided name
      searchOrdersByName(nameFromUrl);
    }
  }, []);

  // Handle name selection from dropdown
  function selectName(selectedName) {
    setName(selectedName);
    setShowNameDropdown(false);
    // Auto-search when selecting from dropdown
    searchOrdersByName(selectedName);
  }

  // Real-time updates for orders
  useEffect(() => {
    if (!searched || !name.trim()) return;

    const customerName = name.trim();

    const ordersChannel = supabase
      .channel(`orders-status-${customerName}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `customer_name=eq.${customerName}`,
        },
        () => {
          // This only fires for orders matching this customer name
          searchOrdersByName(customerName);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
    };
  }, [searched, name]);

  // Search orders by name
  async function searchOrdersByName(searchName) {
    const trimmedName = searchName.trim();
    
    if (!trimmedName) {
      alert("Please enter your name.");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*, drinks(name)")
      .eq("customer_name", trimmedName)
      .order("created_at", { ascending: false });

    if (error) {
      handleError(error, "Failed to load orders");
      setLoading(false);
      return;
    }

    setOrders(data || []);
    setSearched(true);
    setLoading(false);
  }

  // Handle search button click
  function searchOrders() {
    searchOrdersByName(name);
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      searchOrders();
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header with back link */}
        <div className="flex justify-between items-center mb-8">
          <h1 className={STYLES.heading}>order status</h1>
          <a
            href="/"
            className="text-green-700 hover:text-green-800 font-bold text-lg transition-colors flex items-center gap-2"
          >
            <span>←</span>
            <span>back to order</span>
          </a>
        </div>

        {/* Search Input with Dropdown */}
        <div className="flex gap-4 mb-8 items-start">
          <div className="relative w-full max-w-sm">
            <input
              ref={nameInputRef}
              type="text"
              placeholder="enter your name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setShowNameDropdown(true);
              }}
              onFocus={() => setShowNameDropdown(true)}
              onBlur={() => {
                // Delay to allow click on dropdown item
                setTimeout(() => setShowNameDropdown(false), 150);
              }}
              onKeyPress={handleKeyPress}
              className={STYLES.input}
              maxLength={50}
            />
            
            {/* Dropdown suggestions */}
            {showNameDropdown && filteredNames.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto z-50">
                {filteredNames.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => selectName(n)}
                    className="w-full text-left px-4 py-3 hover:bg-green-50 transition-colors first:rounded-t-lg last:rounded-b-lg"
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button
            onClick={searchOrders}
            disabled={loading}
            className="px-8 py-3 text-lg whitespace-nowrap"
          >
            {loading ? "searching..." : "search"}
          </Button>
        </div>

        {/* Results */}
        {searched && (
          <div>
            {orders.length === 0 ? (
              <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-gray-200 text-center">
                <p className="text-gray-600 text-lg">
                  no orders found for "{name}"
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                      <tr>
                        <th className={STYLES.table.header}>Order</th>
                        <th className={STYLES.table.header}>Size</th>
                        <th className={STYLES.table.header}>Time Ordered</th>
                        <th className={STYLES.table.header}>Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                          <td className={STYLES.table.cell}>{order.drinks.name}</td>
                          <td className={STYLES.table.cell}>{order.size || "-"}</td>
                          <td className={STYLES.table.cellSecondary}>{formatTime(order.created_at)}</td>
                          <td className="px-6 py-4">
                            <StatusBadge status={order.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

