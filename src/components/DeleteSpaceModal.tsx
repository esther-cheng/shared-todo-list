"use client";

import React, { useState, useEffect } from "react";
import { Space } from "@/types";
import { AlertTriangle, Trash2, X, Loader2 } from "lucide-react";

interface DeleteSpaceModalProps {
  space: Space | null;
  onClose: () => void;
  onConfirmDelete: (spaceId: string) => Promise<void>;
}

export function DeleteSpaceModal({
  space,
  onClose,
  onConfirmDelete,
}: DeleteSpaceModalProps) {
  const [confirmName, setConfirmName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset confirmation field when opened/changed
  useEffect(() => {
    setConfirmName("");
    setError(null);
    setIsDeleting(false);
  }, [space]);

  if (!space) return null;

  const isMatch = confirmName.trim() === space.name.trim();

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMatch || isDeleting) return;

    setIsDeleting(true);
    setError(null);
    try {
      await onConfirmDelete(space.id);
      onClose();
    } catch (err: unknown) {
      console.error("Failed to delete group:", err);
      const msg = err instanceof Error ? err.message : "Failed to delete group";
      setError(msg);
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#171923]/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#FFFFFF] border border-[#D8D7DE] rounded-[24px] p-6 shadow-[0_10px_32px_rgba(23,25,35,0.12)] space-y-5"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-group-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#FFF0ED] text-[#FF705B] border border-[#FF705B]/30 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2
                id="delete-group-title"
                className="text-[17px] font-bold text-[#171923] tracking-tight leading-tight"
              >
                Delete Group
              </h2>
              <p className="text-[12px] text-[#777783] mt-0.5">
                This action is permanent and cannot be undone.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-[8px] text-[#777783] hover:text-[#171923] hover:bg-[#F4F3F5] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning Callout */}
        <div className="p-3.5 rounded-[14px] bg-[#FFF0ED] border border-[#FF705B]/30 text-[12px] text-[#C2410C] leading-relaxed">
          <p>
            Deleting <strong className="font-semibold text-[#171923]">"{space.name}"</strong> will immediately remove the group, all associated tasks, checklist items, and discussion notes for all members.
          </p>
        </div>

        {/* Confirmation Form */}
        <form onSubmit={handleDelete} className="space-y-4">
          <div>
            <label className="text-[12px] font-semibold text-[#171923] block mb-1.5">
              To confirm, type <span className="font-bold underline decoration-[#FF705B] decoration-2">{space.name}</span> below:
            </label>
            <input
              type="text"
              autoFocus
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={space.name}
              disabled={isDeleting}
              className="w-full text-sm px-3.5 py-2.5 rounded-[12px] bg-[#FFFFFF] border border-[#D8D7DE] focus:border-[#FF705B] focus:outline-none text-[#171923] placeholder-[#777783]/50 transition-colors"
            />
          </div>

          {error && (
            <div className="text-[12px] font-medium text-[#FF705B] p-2.5 rounded-[10px] bg-[#FFF0ED] border border-[#FF705B]/30">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#D8D7DE]/70">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2.5 rounded-[12px] text-xs font-semibold text-[#777783] hover:text-[#171923] hover:bg-[#F4F3F5] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isMatch || isDeleting}
              className={`px-4 py-2.5 rounded-[12px] text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs ${
                isMatch && !isDeleting
                  ? "bg-[#FF705B] text-white hover:bg-[#E0533F] cursor-pointer"
                  : "bg-[#D8D7DE]/70 text-[#777783] cursor-not-allowed opacity-60"
              }`}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete group permanently</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
