import { useEffect, useState, useRef } from "react";
import { supabase } from "./supabaseClient";
import Button from "./components/Button";
import DrinkCard from "./components/DrinkCard";
import SizeSelectionModal from "./components/SizeSelectionModal";
import SuccessScreen from "./components/SuccessScreen";

// Constants
const STYLES = {
  input: "p-3 border-4 border-gray-200 rounded-xl w-full max-w-sm text-lg bg-white focus:outline-none transition",
  heading: "text-3xl font-bold mb-6 text-green-900",
};

// Utility Functions
const handleError = (error, message) => {
  console.error(message, error);
  alert(`${message}. Please try again.`);
};

export default function OrderPage() {
  const [drinks, setDrinks] = useState([]);
  const [approvedNames, setApprovedNames] = useState([]);
  const [name, setName] = useState("");
  const [selectedDrink, setSelectedDrink] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [modalDrink, setModalDrink] = useState(null);
  const [showNameDropdown, setShowNameDropdown] = useState(false);
  const nameInputRef = useRef(null);

  // Filter approved names based on input
  const filteredNames = name.trim()
    ? approvedNames.filter((n) =>
        n.toLowerCase().startsWith(name.toLowerCase().trim())
      )
    : approvedNames;

  // Check if the entered name is in the approved list
  const isNameApproved = approvedNames.some(
    (n) => n.toLowerCase() === name.toLowerCase().trim()
  );

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

  // Load drinks with custom sorting
  async function loadDrinks() {
    const { data, error } = await supabase.from("drinks").select("*");

    if (error) {
      handleError(error, "Error loading drinks");
      return;
    }

    if (!data) return;

    // Sort drinks: Available first, then by custom order (miffy, melanie, boris)
    const customOrder = ["miffy", "melanie", "boris"];
    
    const sortedDrinks = data.sort((a, b) => {
      // First, sort by availability (available before unavailable)
      if (a.is_available && !b.is_available) return -1;
      if (!a.is_available && b.is_available) return 1;

      // Within same availability, sort by custom order
      const aIndex = customOrder.findIndex(name => a.name.toLowerCase().includes(name));
      const bIndex = customOrder.findIndex(name => b.name.toLowerCase().includes(name));
      
      // If both are in custom order, sort by that order
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      
      // If only one is in custom order, prioritize it
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      
      // Otherwise, sort alphabetically
      return a.name.localeCompare(b.name);
    });
    setDrinks(sortedDrinks);
  }

  useEffect(() => {
    loadDrinks();
    loadApprovedUsers();

    // Real-time updates for drinks and users
    const channel = supabase
      .channel("order-page-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "drinks" }, loadDrinks)
      .on("postgres_changes", { event: "*", schema: "public", table: "users" }, loadApprovedUsers)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  function openModal(drink) {
    if (!drink.is_available) return;
    
    setModalDrink(drink);
    setShowModal(true);
    // Small delay to ensure CSS transitions work properly
    setTimeout(() => setIsModalVisible(true), 10);
  }

  function deselectDrink() {
    setSelectedDrink(null);
    setSelectedSize(null);
    closeModal(false);
  }

  function closeModal(clearSelection = true) {
    setIsModalVisible(false);
    setIsModalClosing(true);
    setTimeout(() => {
      setShowModal(false);
      setModalDrink(null);
      setIsModalClosing(false);
      if (clearSelection) {
        setSelectedDrink(null);
        setSelectedSize(null);
      }
    }, 300); // Match animation duration
  }

  function confirmDrinkSelection(size) {
    setSelectedDrink(modalDrink.id);
    setSelectedSize(size);
    closeModal(false); // Don't clear the size when confirming
  }

  // Validate customer name - must be in approved list
  function validateName(name) {
    const sanitized = name.trim();

    if (sanitized.length === 0) {
      alert("Please enter your name.");
      return null;
    }

    // Find matching approved name (case-insensitive)
    const matchedName = approvedNames.find(
      (n) => n.toLowerCase() === sanitized.toLowerCase()
    );

    if (!matchedName) {
      alert("Sorry, your name is not on the guest list.");
      return null;
    }

    // Return the properly cased name from the approved list
    return matchedName;
  }

  // Handle name selection from dropdown
  function selectName(selectedName) {
    setName(selectedName);
    setShowNameDropdown(false);
  }

  // Submit order with validation
  async function submitOrder() {
    if (!name || !selectedDrink || !selectedSize) return;

    const sanitizedName = validateName(name);
    if (!sanitizedName) return;

    // Check if selected drink is still available
    const selectedDrinkData = drinks.find((d) => d.id === selectedDrink);
    if (!selectedDrinkData || !selectedDrinkData.is_available) {
      alert("Sorry, this drink is no longer available. Please select another drink.");
      setSelectedDrink(null);
      setSelectedSize(null);
      return;
    }

    const { error } = await supabase.from("orders").insert({
      customer_name: sanitizedName,
      drink_id: selectedDrink,
      size: selectedSize,
    });

    if (error) {
      handleError(error, "Failed to submit order");
      return;
    }

    setSubmitted(true);
  }

  // Reset order form
  function resetForm() {
    setSubmitted(false);
    setName("");
    setSelectedDrink(null);
    setSelectedSize(null);
  }

  if (submitted) {
    return <SuccessScreen onReset={resetForm} customerName={name} />;
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background Miffy Pattern */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 0,
          backgroundImage: "url(/MiffySmall.svg)",
          backgroundRepeat: "repeat",
          backgroundSize: "150px 150px",
          opacity: 0.3,
          transform: "rotate(-15deg)",
          transformOrigin: "center",
          width: "150%",
          height: "150%",
          left: "-25%",
          top: "-25%",
        }}
      />

      {/* Header Bar - Flush with top and sides */}
      <div 
        className="relative z-10 w-full py-2 shadow-md"
        style={{
          backgroundImage: 'repeating-linear-gradient(90deg, rgba(220, 252, 231, 0.9) 0px, rgba(220, 252, 231, 0.9) 20px, rgba(255, 255, 255, 0.9) 20px, rgba(255, 255, 255, 0.9) 40px)',
        }}
      >
        <div className="flex items-center justify-center gap-3">
          <img src="/MiffyBig.svg" alt="Miffy" className="w-12 h-12" />
          <h1 className="text-3xl font-bold text-green-900">miffy's matcha garden</h1>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center w-full px-4 py-8">

        {/* Name Input with Autocomplete Dropdown */}
        <div className="relative w-full max-w-sm mb-8">
          <input
            ref={nameInputRef}
            type="text"
            placeholder="your name"
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
            maxLength={50}
            required
            className={STYLES.input}
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
          
          {/* Validation indicator */}
          {name.trim() && !isNameApproved && (
            <p className="text-sm text-green-700 mt-2 text-center">
              please select a name from the list
            </p>
          )}
        </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-4xl mb-6">
        {drinks.map((drink) => (
          <DrinkCard
            key={drink.id}
            drink={drink}
            isSelected={selectedDrink === drink.id}
            selectedSize={selectedSize}
            onCardClick={() => openModal(drink)}
            onDeselect={() => {
              setSelectedDrink(null);
              setSelectedSize(null);
            }}
          />
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
        <Button
          onClick={submitOrder}
          disabled={!isNameApproved || !selectedDrink || !selectedSize}
          className="px-8 py-3 text-lg"
        >
          Submit
        </Button>
        <a
          href={`/status${name.trim() ? `?name=${encodeURIComponent(name.trim())}` : ""}`}
          className=" bg-white/90 text-green-700 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-green-50 transition-all shadow-lg hover:shadow-xl text-center whitespace-nowrap"
        >
          see order status
        </a>
      </div>

      {/* Size Selection Modal */}
      {showModal && modalDrink && (
        <SizeSelectionModal
          drink={modalDrink}
          isVisible={isModalVisible}
          isSelectedDrink={selectedDrink === modalDrink.id}
          onSizeSelect={confirmDrinkSelection}
          onClose={() => closeModal(!selectedSize)}
          onDeselect={deselectDrink}
        />
      )}
      </div>
    </div>
  );
}
