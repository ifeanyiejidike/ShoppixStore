import { z } from "zod";
import { NIGERIAN_STATES } from "@/lib/constants";

/** Mirrors apps/accounts/validators.py's ComplexPasswordValidator. */
const passwordSchema = z
  .string()
  .min(8, "Must be at least 8 characters.")
  .regex(/[A-Z]/, "Must contain an uppercase letter.")
  .regex(/[a-z]/, "Must contain a lowercase letter.")
  .regex(/[0-9]/, "Must contain a number.")
  .regex(/[^A-Za-z0-9]/, "Must contain a special character.");

export const registerFormSchema = z
  .object({
    email: z.string().email("Enter a valid email address."),
    password: passwordSchema,
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match.",
    path: ["confirm_password"],
  });
export type RegisterSchema = z.infer<typeof registerFormSchema>;

export const loginFormSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});
export type LoginSchema = z.infer<typeof loginFormSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address."),
});
export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  new_password: passwordSchema,
});
export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z
  .object({
    old_password: z.string().min(1, "Current password is required."),
    new_password: passwordSchema,
    confirm_new_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_new_password, {
    message: "Passwords don't match.",
    path: ["confirm_new_password"],
  });
export type ChangePasswordSchema = z.infer<typeof changePasswordSchema>;

export const registerVendorSchema = z.object({
  email: z.string().email("Enter a valid brand contact email."),
  brand_name: z.string().min(3, "Brand name must be at least 3 characters."),
  description: z.string().max(1000, "Keep it under 1000 characters.").optional(),
});
export type RegisterVendorSchema = z.infer<typeof registerVendorSchema>;

export const shippingAddressSchema = z.object({
  first_name: z.string().min(1, "First name is required."),
  last_name: z.string().min(1, "Last name is required."),
  phone: z
    .string()
    .min(10, "Enter a valid phone number.")
    .regex(/^[0-9+\s-]+$/, "Enter a valid phone number."),
  address: z.string().min(5, "Enter a full street address."),
  state: z.enum(NIGERIAN_STATES, { message: "Select a state." }),
  lga: z.string().min(2, "Enter your LGA."),
  zip_code: z.string().optional(),
  is_default: z.boolean().optional(),
});
export type ShippingAddressSchema = z.infer<typeof shippingAddressSchema>;

export const productFormSchema = z.object({
  name: z.string().min(3, "Product name must be at least 3 characters."),
  description: z.string().max(3000, "Keep it under 3000 characters.").optional(),
  category_id: z.string().uuid().optional().nullable(),
  stock: z.coerce.number().int().min(0, "Stock can't be negative."),
  current_price: z.coerce.number().positive("Price must be greater than 0."),
  old_price: z.coerce.number().positive().optional().nullable(),
  is_on_flash_sales: z.boolean().optional(),
  flash_sale_ends_at: z.string().optional().nullable(),
});
/** Post-coercion shape (numbers) — what onSubmit receives. */
export type ProductFormSchema = z.output<typeof productFormSchema>;
/** Pre-coercion shape (form field values before zod coerces them) — what useForm's
 * field types/defaultValues should use, since inputs start as strings/unknowns. */
export type ProductFormInput = z.input<typeof productFormSchema>;

export const reviewFormSchema = z.object({
  rating: z.coerce.number().int().min(1, "Pick a rating.").max(5),
  comment: z.string().max(2000, "Keep it under 2000 characters.").optional(),
});
export type ReviewFormSchema = z.infer<typeof reviewFormSchema>;
