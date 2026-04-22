import { permanentRedirect } from "next/navigation";

// /checkout is no longer used — the cart handles Stripe checkout directly.
export default function CheckoutPage() {
  permanentRedirect("/cart");
}
