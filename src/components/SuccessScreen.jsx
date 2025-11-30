import Button from "./Button";

export default function SuccessScreen({ onReset, customerName }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-6">
      <h2 className="text-2xl font-bold text-green-800">
        Thanks! Your order has been submitted.
      </h2>
      <div className="flex gap-4">
        <Button onClick={onReset} className="px-8 py-3 text-lg">
          Place Another Order
        </Button>
        <a
          href={`/status?name=${encodeURIComponent(customerName)}`}
          className="bg-green-700 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-green-800 transition-all shadow-lg hover:shadow-xl"
        >
          See Order Status
        </a>
      </div>
    </div>
  );
}

