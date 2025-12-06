import React from 'react';
import Card from './Card';
import Button from './Button';
import StatusBadge from './StatusBadge';
import { ORDER_STATUS } from './StatusBadge';

export default function OrderCard({ order, onUpdateStatus }) {
  return (
    <Card>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <p className="text-xl font-bold text-gray-800">{order.customer_name}</p>
          <p className="text-lg text-gray-600">
            {order.drinks.name}
            {order.size && <span className="text-sm text-gray-500"> ({order.size})</span>}
          </p>
          <StatusBadge status={order.status} />
        </div>
        <div className="flex gap-2">
          {order.status === ORDER_STATUS.PENDING && (
            <Button
              onClick={() => onUpdateStatus(order.id, ORDER_STATUS.IN_PROGRESS)}
              variant="secondary"
            >
              Start
            </Button>
          )}
          <Button
            onClick={() => onUpdateStatus(order.id, ORDER_STATUS.COMPLETE)}
            variant="primary"
            className="bg-green-600 hover:bg-green-700"
          >
            Complete
          </Button>
          <Button
            onClick={() => onUpdateStatus(order.id, ORDER_STATUS.CANCELLED)}
            variant="danger"
          >
            Cancel
          </Button>
        </div>
      </div>
    </Card>
  );
}

