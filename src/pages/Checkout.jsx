import CheckoutForm from "../components/checkout/CheckoutForm";

export default function Checkout() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 text-center">
            Ödeme
          </h1>
          <p className="text-gray-600 text-center mt-2">
            Siparişinizi tamamlamak için bilgilerinizi girin
          </p>
        </div>

        <CheckoutForm />
      </div>
    </div>
  );
}
