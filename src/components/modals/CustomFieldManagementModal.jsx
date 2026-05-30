import React, { useState } from "react";
import { ListPlus, Plus, Edit3, Trash2 } from "lucide-react";
import { addItem, updateItem } from "../../config/db";

export const CustomFieldManagementModal = ({
  activeProfileId,
  showToast,
  onClose,
  customFields,
  openDeleteModal,
}) => {
  const [editingField, setEditingField] = useState(null);
  const [fieldName, setFieldName] = useState("");
  const [fieldType, setFieldType] = useState("text"); // 'text' or 'dropdown'
  const [dropdownOptions, setDropdownOptions] = useState([]);
  const [newOption, setNewOption] = useState("");

  const resetForm = () => {
    setEditingField(null);
    setFieldName("");
    setFieldType("text");
    setDropdownOptions([]);
    setNewOption("");
  };

  const handleEdit = (field) => {
    setEditingField(field);
    setFieldName(field.name);
    setFieldType(field.type || "text");
    setDropdownOptions(field.options || []);
  };

  const handleAddOption = () => {
    const option = newOption.trim();
    if (option && !dropdownOptions.includes(option)) {
      setDropdownOptions([...dropdownOptions, option]);
      setNewOption("");
    }
  };

  const removeOption = (idx) => {
    setDropdownOptions(dropdownOptions.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = fieldName.trim();
    if (!name) return showToast("Nama field wajib diisi", "error");

    const fieldData = {
      id: editingField ? editingField.id : crypto.randomUUID(),
      profileId: activeProfileId,
      name: name,
      type: fieldType,
      options: fieldType === "dropdown" ? dropdownOptions : [],
      createdAt: editingField ? editingField.createdAt : new Date(),
      updatedAt: new Date(),
    };

    try {
      if (editingField) {
        await updateItem("custom_fields", fieldData);
        showToast("Field berhasil diperbarui", "success");
      } else {
        await addItem("custom_fields", fieldData);
        showToast("Field berhasil ditambahkan", "success");
      }
      resetForm();
    } catch (err) {
      showToast("Gagal menyimpan field", "error");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <ListPlus
              size={24}
              className="mr-2 text-indigo-500 dark:text-indigo-400"
            />{" "}
            Kelola Field Tambahan
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors text-3xl font-light"
          >
            &times;
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden">
          {/* Form Section */}
          <form
            onSubmit={handleSubmit}
            className="p-4 bg-gray-100/50 dark:bg-gray-700/50 rounded-lg flex flex-col space-y-4 overflow-y-auto"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {editingField ? "Edit Field" : "Tambah Field"}
            </h3>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Nama Field
              </label>
              <input
                type="text"
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-2 rounded border border-gray-300 dark:border-gray-600"
                placeholder="Contoh: Sesi atau Emosi"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Tipe Input
              </label>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setFieldType("text")}
                  className={`flex-1 py-2 text-sm rounded border transition-colors ${
                    fieldType === "text"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white dark:bg-gray-800 text-gray-500 border-gray-300 dark:border-gray-600"
                  }`}
                >
                  Teks Bebas
                </button>
                <button
                  type="button"
                  onClick={() => setFieldType("dropdown")}
                  className={`flex-1 py-2 text-sm rounded border transition-colors ${
                    fieldType === "dropdown"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white dark:bg-gray-800 text-gray-500 border-gray-300 dark:border-gray-600"
                  }`}
                >
                  Dropdown (Pilihan)
                </button>
              </div>
            </div>

            {fieldType === "dropdown" && (
              <div className="space-y-2 animate-fadeIn">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Opsi Dropdown
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    className="flex-grow bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-2 rounded border border-gray-300 dark:border-gray-600 text-sm"
                    placeholder="Tambah opsi..."
                  />
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="p-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {dropdownOptions.map((opt, i) => (
                    <span
                      key={i}
                      className="flex items-center bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs"
                    >
                      {opt}
                      <button
                        type="button"
                        onClick={() => removeOption(i)}
                        className="ml-1 text-blue-500 hover:text-red-500"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex space-x-2 pt-4">
              <button
                type="submit"
                className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {editingField ? "Simpan Perubahan" : "Tambah Field"}
              </button>
              {editingField && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Batal
                </button>
              )}
            </div>
          </form>

          {/* List Section */}
          <div className="flex flex-col overflow-hidden">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Daftar Field ({customFields.length})
            </h3>
            <div className="overflow-y-auto space-y-2 pr-2">
              {customFields.length === 0 ? (
                <p className="text-gray-500 text-sm p-4 text-center bg-gray-100 dark:bg-gray-700 rounded-lg">
                  Belum ada field tambahan.
                </p>
              ) : (
                customFields.map((f) => (
                  <div
                    key={f.id}
                    className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg flex justify-between items-center group"
                  >
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-white block">
                        {f.name}
                      </span>
                      <span className="text-xs text-gray-500 capitalize">
                        {f.type === "dropdown"
                          ? `Dropdown (${f.options.length} opsi)`
                          : "Teks Bebas"}
                      </span>
                    </div>
                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleEdit(f)}
                        className="p-1.5 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900 rounded"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => openDeleteModal("custom_field", f)}
                        className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors font-medium"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomFieldManagementModal;
