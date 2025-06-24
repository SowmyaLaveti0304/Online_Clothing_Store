import { DateTimePicker } from "@mantine/dates";
import { Modal, Radio, TextInput, Button } from "@mantine/core";
import { OrderType, PaymentMethod } from "@prisma/client";
import { useState } from "react";

interface CheckoutModalProps {
  opened: boolean;
  onClose: () => void;
  totalAmount: number;
  onSubmit: (values: CheckoutFormValues) => void;
}

export interface CheckoutFormValues {
  orderType: OrderType;
  pickupTime?: Date;
  paymentMethod: PaymentMethod;
  cardHolderName: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvc: string;
  street?: string;
  apt?: string;
  city?: string;
  state?: string;
  zipcode?: string;
}

export function CheckoutModal({ opened, onClose, totalAmount, onSubmit }: CheckoutModalProps) {
  const [orderType, setOrderType] = useState<OrderType>(OrderType.PICKUP);
  const [formData, setFormData] = useState<CheckoutFormValues>({
    orderType: OrderType.PICKUP,
    paymentMethod: PaymentMethod.CREDIT_CARD,
    cardHolderName: "",
    cardNumber: "",
    cardExpiry: "",
    cardCvc: "",
    street: "",
    apt: "",
    city: "",
    state: "",
    zipcode: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Complete Checkout" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <p className="text-lg font-semibold">Total Amount: ${totalAmount.toFixed(2)}</p>
        </div>

        <Radio.Group
          label="Order Type"
          value={formData.orderType}
          onChange={(value) => {
            setOrderType(value as OrderType);
            setFormData((prev) => ({ ...prev, orderType: value as OrderType }));
          }}
        >
          <div className="space-y-2">
            <Radio label="Pickup" value={OrderType.PICKUP} />
            <Radio label="Delivery" value={OrderType.DELIVERY} />
          </div>
        </Radio.Group>

        {orderType === OrderType.PICKUP && (
          <DateTimePicker
            label="Pickup Time"
            placeholder="Select pickup time"
            minDate={new Date()}
            value={formData.pickupTime}
            onChange={(date) => setFormData((prev) => ({ ...prev, pickupTime: date || undefined }))}
          />
        )}

        {orderType === OrderType.DELIVERY && (
          <>
            <TextInput
              label="Street"
              placeholder="Enter your street"
              name="street"
              value={formData.street}
              onChange={handleInputChange}
            />

            <TextInput
              label="Apt"
              placeholder="Enter your apt"
              name="apt"
              value={formData.apt}
              onChange={handleInputChange}
            />

            <TextInput
              label="City"
              placeholder="Enter your city"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
            />

            <TextInput
              label="State"
              placeholder="Enter your state"
              name="state"
              value={formData.state}
              onChange={handleInputChange}
            />

            <TextInput
              label="Zipcode"
              placeholder="Enter your zipcode"
              name="zipcode"
              value={formData.zipcode}
              onChange={handleInputChange}
            />
          </>
        )}

        <Radio.Group
          label="Payment Method"
          value={formData.paymentMethod}
          onChange={(value) =>
            setFormData((prev) => ({ ...prev, paymentMethod: value as PaymentMethod }))
          }
        >
          <div className="space-y-2">
            <Radio label="Credit Card" value={PaymentMethod.CREDIT_CARD} />
            <Radio label="Debit Card" value={PaymentMethod.DEBIT_CARD} />
          </div>
        </Radio.Group>

        <div className="space-y-4">
          <TextInput
            label="Card Holder Name"
            placeholder="John Doe"
            name="cardHolderName"
            value={formData.cardHolderName}
            onChange={handleInputChange}
            required
          />
          <TextInput
            label="Card Number"
            placeholder="1234 5678 9012 3456"
            name="cardNumber"
            value={formData.cardNumber}
            onChange={handleInputChange}
            maxLength={16}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <TextInput
              label="Expiry Date"
              placeholder="MM/YY"
              name="cardExpiry"
              value={formData.cardExpiry}
              onChange={handleInputChange}
              required
            />
            <TextInput
              label="CVC"
              placeholder="123"
              name="cardCvc"
              value={formData.cardCvc}
              onChange={handleInputChange}
              required
              maxLength={3}
            />
          </div>
        </div>

        <Button type="submit" fullWidth>
          Complete Payment
        </Button>
      </form>
    </Modal>
  );
}
