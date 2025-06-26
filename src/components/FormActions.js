import React from "react";
import { useNavigate } from "react-router-dom";

const FormActions = ({ loading }) => {
  const navigate = useNavigate();

  return (
    <div className="flex justify-end space-x-4 mt-6">
      <button
        type="button"
        className="bg-gray-400 text-white px-4 py-2 rounded-md hover:bg-gray-500 disabled:bg-gray-300"
        onClick={() => navigate("/incident-overview")}
        disabled={loading}
      >
        Cancel
      </button>
      <button
        type="submit"
        className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 disabled:bg-green-300"
        disabled={loading}
      >
        {loading ? "Submitting..." : "Submit"}
      </button>
    </div>
  );
};

export default FormActions;
