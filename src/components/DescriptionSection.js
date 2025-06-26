import React from "react";

const DescriptionSection = ({
  formData,
  handleChange,
  attachment,
  setAttachment,
  loading,
}) => (
  <>
    <div className="mt-4">
      <label className="block text-sm font-medium">Subject *</label>
      <input
        type="text"
        name="subject"
        value={formData.subject}
        onChange={handleChange}
        className="w-full border px-3 py-2 rounded-md"
        required
        disabled={loading}
      />
    </div>
    <div className="mt-4">
      <label className="block text-sm font-medium">Description *</label>
      <textarea
        name="description"
        value={formData.description}
        onChange={handleChange}
        rows="4"
        className="w-full border px-3 py-2 rounded-md"
        required
        disabled={loading}
      />
    </div>
    <div className="mt-4">
      <label className="block text-sm font-medium">Attachment</label>
      <input
        type="file"
        onChange={(e) => setAttachment(e.target.files[0])}
        className="w-full border px-3 py-2 rounded-md"
        disabled={loading}
      />
      {attachment && (
        <div className="mt-2 text-sm text-gray-600">
          Selected: {attachment.name}
        </div>
      )}
    </div>
  </>
);

export default DescriptionSection;
