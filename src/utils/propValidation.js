/**
 * ANDA E-TİCARET PROP VALIDATION UTILITY
 *
 * Proje genelinde tutarlı prop validation için merkezi sistem
 * PropTypes yerine modern JavaScript/TypeScript type hints
 */

/**
 * Common prop validation patterns
 * JSDoc ile type hinting + runtime validation (development only)
 */

/**
 * @typedef {Object} ProductType
 * @property {string} id - Product ID
 * @property {string} name - Product name
 * @property {number} price - Product price
 * @property {string} [description] - Product description
 * @property {string[]} [images] - Product images
 * @property {string} [category] - Product category
 * @property {number} [inventory_quantity] - Stock quantity
 * @property {string} status - Product status
 * @property {string} slug - Product URL slug
 */

/**
 * @typedef {Object} UserType
 * @property {string} id - User ID
 * @property {string} email - User email
 * @property {string} full_name - User full name
 * @property {string} role - User role (user|seller|admin)
 * @property {Object} [profile] - User profile data
 */

/**
 * @typedef {Object} ComponentProps
 * @property {React.ReactNode} [children] - Component children
 * @property {string} [className] - CSS class names
 * @property {boolean} [disabled] - Disabled state
 * @property {boolean} [loading] - Loading state
 * @property {Function} [onClick] - Click handler
 */

/**
 * Development-only prop validation
 * More performant than PropTypes and integrates with modern tooling
 */
export const validateProps = (props, expectedTypes, componentName) => {
  if (import.meta.env.PROD) return; // Skip in production

  Object.entries(expectedTypes).forEach(([propName, validator]) => {
    const value = props[propName];

    if (validator.required && (value === undefined || value === null)) {
      console.warn(`[${componentName}] Required prop '${propName}' is missing`);
    }

    if (value !== undefined && validator.type && !validator.type(value)) {
      console.warn(
        `[${componentName}] Invalid prop '${propName}': expected ${
          validator.typeName
        }, got ${typeof value}`
      );
    }
  });
};

/**
 * Common type validators
 */
export const types = {
  string: (value) => typeof value === "string",
  number: (value) => typeof value === "number" && !isNaN(value),
  boolean: (value) => typeof value === "boolean",
  function: (value) => typeof value === "function",
  object: (value) => typeof value === "object" && value !== null,
  array: (value) => Array.isArray(value),
  node: (value) =>
    value === null ||
    value === undefined ||
    typeof value === "string" ||
    typeof value === "number" ||
    React.isValidElement(value),
  oneOf: (allowedValues) => (value) => allowedValues.includes(value),
  arrayOf: (type) => (value) => Array.isArray(value) && value.every(type),
  shape: (shape) => (value) => {
    if (typeof value !== "object" || value === null) return false;
    return Object.entries(shape).every(([key, validator]) =>
      validator(value[key])
    );
  },
};

/**
 * Prop validation hook for functional components
 */
export const useProps = (props, expectedTypes, componentName) => {
  if (import.meta.env.DEV) {
    validateProps(props, expectedTypes, componentName);
  }
  return props;
};

/**
 * HOC for automatic prop validation
 */
export const withPropValidation = (Component, expectedTypes) => {
  const WrappedComponent = (props) => {
    useProps(props, expectedTypes, Component.name || "Component");
    return <Component {...props} />;
  };

  WrappedComponent.displayName = `withPropValidation(${
    Component.name || "Component"
  })`;
  return WrappedComponent;
};

/**
 * Common prop type definitions for reuse
 */
export const commonProps = {
  className: { type: types.string, typeName: "string" },
  children: { type: types.node, typeName: "React.ReactNode" },
  disabled: { type: types.boolean, typeName: "boolean" },
  loading: { type: types.boolean, typeName: "boolean" },
  onClick: { type: types.function, typeName: "function" },
  onSubmit: { type: types.function, typeName: "function" },
  id: { type: types.string, typeName: "string", required: true },
  title: { type: types.string, typeName: "string" },
  description: { type: types.string, typeName: "string" },
};

export default {
  validateProps,
  types,
  useProps,
  withPropValidation,
  commonProps,
};
