// These mirror the Django REST Framework serializers field-for-field.
// See shoppix_backend/apps/*/serializers.py for the source of truth.

export interface User {
  id: string;
  email: string;
  is_active: boolean;
  is_customer: boolean;
  is_vendor: boolean;
  is_email_verified: boolean;
  date_joined: string;
}

export interface ShippingAddress {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
  country: string;
  state: string;
  lga: string;
  zip_code: string;
  is_default: boolean;
  created_at: string;
}

export interface Vendor {
  id: string;
  user: User;
  email: string;
  brand_name: string;
  slug: string;
  description: string;
  avatar: string | null;
  is_activated: boolean;
  is_diamond: boolean;
  total_sales_ever: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent: string | null;
  image: string | null;
  is_active: boolean;
}

export interface ProductImage {
  id: string;
  image: string;
  alt_text: string;
  sort_order: number;
}

export interface Product {
  id: string;
  vendor: Vendor;
  category: Category | null;
  name: string;
  slug: string;
  description: string;
  stock: number;
  current_price: string;
  old_price: string | null;
  thumbnail: string | null;
  images: ProductImage[];
  is_active: boolean;
  is_on_flash_sales: boolean;
  flash_sale_ends_at: string | null;
  is_in_stock: boolean;
  is_flash_sale_active: boolean;
  percentage_difference: number;
  created_at: string;
  updated_at: string;
}

/** Lighter payload used on listing/grid pages (ProductListSerializer). */
export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  vendor_name: string;
  current_price: string;
  old_price: string | null;
  thumbnail: string | null;
  is_in_stock: boolean;
  is_on_flash_sales: boolean;
  percentage_difference: number;
}

export interface CartItem {
  id: string;
  product: ProductListItem;
  quantity: number;
  added_at: string;
  sub_total: string;
}

export interface Cart {
  id: string;
  cart_items: CartItem[];
  total: string;
  item_count: number;
  created_at: string;
  updated_at: string;
}

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export interface OrderItem {
  id: string;
  product: string;
  product_name: string;
  product_thumbnail: string | null;
  vendor: string;
  quantity: number;
  price_per_item: string;
  sub_total: string;
  fulfillment_status: OrderStatus;
}

export interface Order {
  id: string;
  status: OrderStatus;
  order_items: OrderItem[];
  amount: string;
  order_reference: string;
  payment_reference: string;
  shipping_address: ShippingAddress | null;
  created_at: string;
  updated_at: string;
}

export interface VendorOrderItem {
  id: string;
  order_reference: string;
  order_status: OrderStatus;
  customer_email: string;
  product_name: string;
  quantity: number;
  price_per_item: string;
  sub_total: string;
  vendor_earning: number;
  fulfillment_status: OrderStatus;
}

export type PaymentMethod = "paystack" | "opay";
export type PaymentStatus = "pending" | "successful" | "failed" | "abandoned";

export interface Payment {
  id: string;
  order: string;
  amount: string;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  payment_reference: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  product: string;
  user_email: string;
  rating: number;
  comment: string;
  is_verified_purchase: boolean;
  created_at: string;
}

/** Shape returned by DRF's PageNumberPagination via StandardResultsSetPagination. */
export interface Paginated<T> {
  count: number;
  total_pages: number;
  current_page: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/** Standard DRF error shape our custom_exception_handler produces. */
export interface ApiErrorBody {
  detail?: string | string[];
  status_code?: number;
  [field: string]: unknown;
}
