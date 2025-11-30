import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

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

  useEffect(() => {
    async function loadDrinks() {
      const { data, error } = await supabase
        .from("drinks")
        .select("*");
      
      if (error) {
        console.error("Error loading drinks:", error);
        return;
      }
      
      if (!data) return;
      
      // Sort drinks with "classic matcha latte" first, then others
      const sortedDrinks = data.sort((a, b) => {
        const aIsClassic = a.name.toLowerCase().includes("classic matcha latte");
        const bIsClassic = b.name.toLowerCase().includes("classic matcha latte");
        
        if (aIsClassic && !bIsClassic) return -1;
        if (!aIsClassic && bIsClassic) return 1;
        return 0; // Keep original order for other drinks
      });
      setDrinks(sortedDrinks);
    }
    loadDrinks();

    // Real-time updates for drinks
    const channel = supabase
      .channel("drinks-order-page")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "drinks" },
        () => loadDrinks()
      )
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

  async function submitOrder() {
    if (!name || !selectedDrink || !selectedSize) return;

    // Validate and sanitize name
    const sanitizedName = name.trim();
    
    if (sanitizedName.length === 0) {
      alert("Please enter your name.");
      return;
    }
    
    if (sanitizedName.length > 50) {
      alert("Name is too long. Please keep it under 50 characters.");
      return;
    }

    // Check if selected drink is still available
    const selectedDrinkData = drinks.find(d => d.id === selectedDrink);
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
      console.error("Error submitting order:", error);
      alert("Failed to submit order. Please try again.");
      return;
    }

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-green-100 gap-6">
        <h2 className="text-2xl font-bold text-green-800">
          Thanks! Your order has been submitted.
        </h2>
        <button
          onClick={() => {
            setSubmitted(false);
            setName("");
            setSelectedDrink(null);
            setSelectedSize(null);
          }}
          className="bg-green-700 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-green-800 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
        >
          Place Another Order
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-4 relative">
      {/* Background Miffy Pattern */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{ 
          zIndex: 0,
          backgroundImage: 'url(/MiffySmall.svg)',
          backgroundRepeat: 'repeat',
          backgroundSize: '150px 150px',
          opacity: 0.3,
          transform: 'rotate(-15deg)',
          transformOrigin: 'center',
          width: '150%',
          height: '150%',
          left: '-25%',
          top: '-25%'
        }}
      />
      
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center w-full">
        <h1 className="text-3xl font-bold mb-6 text-green-900">miffy's matcha garden</h1>

      <input
        type="text"
        placeholder="Your Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={50}
        required
        className="mb-8 p-3 border-4 border-gray-200 rounded-xl w-full max-w-sm text-lg bg-white focus:outline-none transition"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-4xl mb-6">
        {drinks.map((drink) => (
          <div
            key={drink.id}
            className={`rounded-xl shadow-lg text-center transition-all duration-300 relative
            ${!drink.is_available 
              ? "opacity-60 cursor-not-allowed bg-gray-100 border-4 border-gray-300 p-6 pb-12" 
              : selectedDrink === drink.id 
              ? "border-4 border-green-700 bg-green-50 shadow-green-200 cursor-pointer transform hover:scale-105 hover:shadow-xl p-6 pb-12" 
              : "bg-white border-4 border-gray-200 cursor-pointer transform hover:scale-105 hover:shadow-xl p-6 pb-12"}`}
            onClick={() => openModal(drink)}
          >
            {!drink.is_available && (
              <div className="absolute top-3 right-3">
                <span className="bg-gray-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                  SOLD OUT
                </span>
              </div>
            )}
            {selectedDrink === drink.id && drink.is_available && (
              <div className="absolute top-3 right-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDrink(null);
                    setSelectedSize(null);
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center transition-colors"
                  title="Deselect this drink"
                >
                  ×
                </button>
              </div>
            )}
            <h2 className={`text-lg font-bold mb-2 whitespace-nowrap ${!drink.is_available ? "text-gray-500" : "text-gray-800"}`}>
              {drink.name}
            </h2>
            {drink.description && (
              <p className={`text-sm mt-2 text-left font-light leading-tight ${!drink.is_available ? "text-gray-400" : "text-gray-600"}`}>
                {drink.description}
              </p>
            )}
            {selectedDrink === drink.id && selectedSize && (
              <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2">
                <span className="inline-block bg-green-700 text-white px-4 py-1 rounded-full text-xs font-bold">
                  {selectedSize}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={submitOrder}
        className="bg-green-700 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-green-800 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!name || !selectedDrink || !selectedSize}
      >
        Submit
      </button>

      {/* Size Selection Modal */}
      {showModal && modalDrink && (
        <div 
          className={`fixed inset-0 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-out ${isModalVisible ? 'opacity-100' : 'opacity-0'}`}
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)' }} 
          onClick={() => closeModal(!selectedSize)}
        >
          <div 
            className={`bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border-4 border-gray-200 transition-all duration-300 ease-out transform ${isModalVisible ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">{modalDrink.name}</h2>
              {modalDrink.description && (
                <p className="text-gray-600 mb-6 text-left font-normal">{modalDrink.description}</p>
              )}
              
              <h3 className="text-lg font-semibold text-gray-700 mb-4">select size:</h3>
              
              <div className="space-y-3 mb-6">
                <button
                  onClick={() => confirmDrinkSelection("small")}
                  className="w-full bg-white border-4 border-gray-300 hover:border-green-700 hover:bg-green-50 p-4 rounded-xl transition-all transform hover:scale-105"
                >
                  <div className="font-bold text-lg text-gray-800">small</div>
                  <div className="text-sm text-gray-600">4 grams of matcha</div>
                </button>
                
                <button
                  onClick={() => confirmDrinkSelection("medium")}
                  className="w-full bg-white border-4 border-gray-300 hover:border-green-700 hover:bg-green-50 p-4 rounded-xl transition-all transform hover:scale-105"
                >
                  <div className="font-bold text-lg text-gray-800">medium</div>
                  <div className="text-sm text-gray-600">6 grams of matcha</div>
                </button>
              </div>
              
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => closeModal(!selectedSize)}
                  className="text-gray-500 hover:text-gray-700 font-semibold"
                >
                  cancel
                </button>
                {selectedDrink === modalDrink.id && (
                  <>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={deselectDrink}
                      className="text-green-600 hover:text-green-700 font-semibold"
                    >
                      deselect drink
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
