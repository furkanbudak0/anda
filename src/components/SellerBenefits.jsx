import {
  FiTruck,
  FiPieChart,
  FiDollarSign,
  FiShield,
  FiTrendingUp,
} from "react-icons/fi";

const benefits = [
  {
    icon: <FiTrendingUp className="text-2xl text-purple-300" />,
    title: "Grow Your Sales",
    description: "Access millions of potential customers",
  },
  {
    icon: <FiTruck className="text-2xl text-purple-300" />,
    title: "Fulfillment Services",
    description: "Optional warehousing and shipping solutions",
  },
  {
    icon: <FiPieChart className="text-2xl text-purple-300" />,
    title: "Advanced Analytics",
    description: "Real-time sales and inventory reports",
  },
  {
    icon: <FiDollarSign className="text-2xl text-purple-300" />,
    title: "Competitive Rates",
    description: "Low commission fees with premium options",
  },
  {
    icon: <FiShield className="text-2xl text-purple-300" />,
    title: "Seller Protection",
    description: "Secure payments and fraud prevention",
  },
];

export default function SellerBenefits() {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold mb-4">Why sell with us?</h3>
      {benefits.map((benefit, index) => (
        <div key={index} className="flex items-start">
          <div className="mr-4 mt-1">{benefit.icon}</div>
          <div>
            <h4 className="font-medium">{benefit.title}</h4>
            <p className="text-sm text-purple-200">{benefit.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
