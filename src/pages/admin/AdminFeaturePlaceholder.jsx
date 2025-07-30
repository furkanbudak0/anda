import PropTypes from "prop-types";

const AdminFeaturePlaceholder = ({ title }) => {
  return (
    <div style={{ padding: 32 }}>
      <h2>{title || "Özellik Yakında"}</h2>
      <p>
        Bu sayfa yakında eklenecek. Şimdilik statik bir placeholder olarak
        gösterilmektedir.
      </p>
    </div>
  );
};

AdminFeaturePlaceholder.propTypes = {
  title: PropTypes.string,
};

export default AdminFeaturePlaceholder;
