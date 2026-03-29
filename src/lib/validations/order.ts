import { z } from 'zod';

export const orderItemSchema = z.object({
  product_id: z.string().nullable(),
  name: z.string().min(1, "Product name is required"),
  quantity: z.number().positive("Quantity must be positive"),
  unit: z.string().min(1, "Unit is required"),
  price_at_time: z.number().min(0, "Price cannot be negative"),
});

export const orderSchema = z.object({
  customer_name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  customer_phone: z.string().regex(/^\+?[\d\s\-]{7,15}$/, "Invalid phone format"),
  delivery_location: z.string().min(5, "Please provide a detailed address").max(300, "Address is too long"),
  is_gift: z.boolean().default(false),
  recipient_name: z.string().optional(),
  recipient_phone: z.string().optional(),
  express_delivery: z.boolean().default(false),
  order_type: z.enum(['standard', 'basket', 'custom']),
  custom_items: z.string().max(2000).optional(),
  total_amount: z.number().min(0, "Total cannot be negative"),
  whatsapp_sent: z.boolean().default(false),
  whatsapp_sent_at: z.string().datetime(),
  items: z.array(orderItemSchema).default([]),
});

export type OrderValidationSchema = z.infer<typeof orderSchema>;
export type OrderItemValidationSchema = z.infer<typeof orderItemSchema>;
