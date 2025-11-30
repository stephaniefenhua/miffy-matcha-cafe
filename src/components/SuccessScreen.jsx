import Button from "./Button";

export default function SuccessScreen({ onReset }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-6">
      <h2 className="text-2xl font-bold text-green-800">
        Thanks! Your order has been submitted.
      </h2>
      <Button onClick={onReset} className="px-8 py-3 text-lg">
        Place Another Order
      </Button>
    </div>
  );
}

