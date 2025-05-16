import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface EditableCellProps {
  value: string;
  onSave: (newValue: string) => Promise<void>;
  className?: string;
}

const EditableCell: React.FC<EditableCellProps> = ({ value, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const isSaving = useRef(false); // Prevent duplicate saves

  const handleSave = async () => {
    if (isSaving.current || currentValue === value) return; // Prevent duplicate saves or unnecessary saves
    isSaving.current = true;
    try {
      await onSave(currentValue);
      toast.success("Changes saved successfully!");
    } catch (error) {
      toast.error("Failed to save changes.");
    } finally {
      isSaving.current = false;
      setIsEditing(false);
    }
  };

  const handleBlur = async () => {
    await handleSave();
  };

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      await handleSave();
    } else if (e.key === "Escape") {
      setCurrentValue(value); // Revert changes
      setIsEditing(false);
    }
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  return isEditing ? (
    <input
      ref={inputRef}
      type="text"
      value={currentValue}
      onChange={(e) => setCurrentValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className="border border-gray-300 rounded px-2 py-1 w-full"
    />
  ) : (
    <div
      onDoubleClick={() => setIsEditing(true)}
      className="cursor-pointer hover:bg-gray-100 px-2 py-1"
    >
      {value || "N/A"}
    </div>
  );
};

export default EditableCell;