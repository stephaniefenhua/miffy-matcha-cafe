// Styles
const STYLES = {
  container: "flex flex-col items-center justify-center h-screen gap-10",
  heading: "text-2xl font-bold text-green-800",
  buttonGroup: "flex flex-col items-center gap-6",
  primaryButton: "bg-green-700 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-green-800 transition-all shadow-lg hover:shadow-xl",
  linkButton: "text-green-700 hover:text-green-800 font-bold text-lg transition-colors flex items-center gap-2",
};

const TEXT = {
  heading: "thanks! we've received your order.",
  orderStatus: "see order status",
  placeAnother: "place another order",
  arrow: "←",
};

export default function SuccessScreen({ onReset, customerName }) {
  const statusUrl = `/status?name=${encodeURIComponent(customerName)}`;

  return (
    <div className={STYLES.container}>
      <h2 className={STYLES.heading}>{TEXT.heading}</h2>
      <div className={STYLES.buttonGroup}>
        <a href={statusUrl} className={STYLES.primaryButton}>
          {TEXT.orderStatus}
        </a>
        <button onClick={onReset} className={STYLES.linkButton}>
          <span>{TEXT.arrow}</span>
          <span>{TEXT.placeAnother}</span>
        </button>
      </div>
    </div>
  );
}

