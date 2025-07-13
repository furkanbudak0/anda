function Discount({ product }) {
  return (
    <div className="relative">
      <button className="absolute top-2 left-2 bg-red-600 text-white font-bold px-3 py-1 rounded-lg shadow-lg">
        {product.discount}% indirim
      </button>
    </div>
  );
}

export default Discount;
