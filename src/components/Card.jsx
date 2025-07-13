import { NavLink } from "react-router-dom";
import Discount from "./Discount";
import gömlek from "../images/gömlek.jpg";

const Card = ({ product, children }) => {
  const productImage =
    product.thumbnail ||
    gömlek ||
    "https://en.m.wikipedia.org/wiki/File:No_image_available.svg";

  return (
    <div className="border rounded-lg shadow-lg p-6 mx-4 mb-4">
      <Discount product={product} />
      <img
        src={productImage}
        alt={product.name}
        className="w-full object-cover rounded h-64"
      />
      <h2 className="text-lg font-semibold mt-2">
        {product.name} <b>{product.brand}</b>
      </h2>
      <p className="text-gray-600">{product.description}</p>
      <p className="text-green-600 font-bold mt-2">
        {product.discounted_price} {product.currency}
      </p>
      {product.discount > 0 && (
        <p className="text-red-500 line-through">
          {product.price} {product.currency}
        </p>
      )}
      <div className="flex gap-2 mt-4">{children}</div>
    </div>
  );
};

export default Card;
