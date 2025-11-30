const ORDER_STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETE: "complete",
  CANCELLED: "cancelled",
};

const STATUS_STYLES = {
  [ORDER_STATUS.PENDING]: "bg-yellow-100 text-yellow-800",
  [ORDER_STATUS.IN_PROGRESS]: "bg-blue-100 text-blue-800",
  [ORDER_STATUS.COMPLETE]: "bg-green-100 text-green-800",
  [ORDER_STATUS.CANCELLED]: "bg-red-100 text-red-800",
};

const formatStatus = (status) => {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default function StatusBadge({ status, className = "" }) {
  return (
    <span
      className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-semibold ${
        STATUS_STYLES[status] || STATUS_STYLES[ORDER_STATUS.COMPLETE]
      } ${className}`}
    >
      {formatStatus(status)}
    </span>
  );
}

export { ORDER_STATUS };

