import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import Button from "./components/Button";
import DrinkCard from "./components/DrinkCard";
import SizeSelectionModal from "./components/SizeSelectionModal";
import SuccessScreen from "./components/SuccessScreen";

// Constants
const STYLES = {
  input: "mb-8 p-3 border-4 border-gray-200 rounded-xl w-full max-w-sm text-lg bg-white focus:outline-none transition",
  heading: "text-3xl font-bold mb-6 text-green-900",
};

// Utility Functions
const handleError = (error, message) => {
  console.error(message, error);
  alert(`${message}. Please try again.`);
};

export default function OrderPage() {
  const [drinks, setDrinks] = useState([]);
  const [name, setName] = useState("");
  const [selectedDrink, setSelectedDrink] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [modalDrink, setModalDrink] = useState(null);

  // Load drinks with custom sorting
  async function loadDrinks() {
    const { data, error } = await supabase.from("drinks").select("*");

    if (error) {
      handleError(error, "Error loading drinks");
      return;
    }

    if (!data) return;

    // Sort drinks: Classic first, then by availability, then alphabetically
    const sortedDrinks = data.sort((a, b) => {
      const aIsClassic = a.name.toLowerCase().includes("classic matcha latte");
      const bIsClassic = b.name.toLowerCase().includes("classic matcha latte");

      // Classic matcha latte always first
      if (aIsClassic && !bIsClassic) return -1;
      if (!aIsClassic && bIsClassic) return 1;

      // Then by availability (available before unavailable)
      if (a.is_available && !b.is_available) return -1;
      if (!a.is_available && b.is_available) return 1;

      // Then alphabetically
      return a.name.localeCompare(b.name);
    });
    setDrinks(sortedDrinks);
  }

  useEffect(() => {
    loadDrinks();

    // Real-time updates for drinks
    const channel = supabase
      .channel("drinks-order-page")
      .on("postgres_changes", { event: "*", schema: "public", table: "drinks" }, loadDrinks)
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

  // Validate customer name
  function validateName(name) {
    const sanitized = name.trim();

    if (sanitized.length === 0) {
      alert("Please enter your name.");
      return null;
    }

    if (sanitized.length > 50) {
      alert("Name is too long. Please keep it under 50 characters.");
      return null;
    }

    return sanitized;
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
    <div className="min-h-screen flex flex-col items-center p-4 relative">
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

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center w-full">
        <h1 className={STYLES.heading}>miffy's matcha garden</h1>

        {/* Name Input with Order Status Button */}
        <div className="flex flex-row gap-4 items-center justify-center mb-8 w-full max-w-4xl px-4">
          <input
            type="text"
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            required
            className="flex-1 max-w-xs p-3 border-4 border-gray-200 rounded-xl text-sm sm:text-lg bg-white focus:outline-none transition"
          />
          <a
            href={`/status${name.trim() ? `?name=${encodeURIComponent(name.trim())}` : ""}`}
            className="bg-green-700 text-white px-4 py-3 rounded-lg text-sm sm:text-lg font-semibold hover:bg-green-800 transition-all shadow-lg hover:shadow-xl text-center whitespace-nowrap"
          >
            see order status
          </a>
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

      <Button
        onClick={submitOrder}
        disabled={!name || !selectedDrink || !selectedSize}
        className="px-8 py-3 text-lg"
      >
        Submit
      </Button>

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
