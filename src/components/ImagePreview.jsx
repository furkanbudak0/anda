import { useState } from "react";
import PropTypes from "prop-types";

const ImagePreview = ({ src, alt, onRemove }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative rounded-md overflow-hidden border border-gray-200"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img src={src} alt={alt} className="w-full h-24 object-cover" />

      {isHovered && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
          aria-label="Resmi kaldır"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

ImagePreview.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  onRemove: PropTypes.func.isRequired,
};

export default ImagePreview;
