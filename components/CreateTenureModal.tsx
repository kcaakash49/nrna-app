"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { createTenure } from "@/actions/committee-members/tenure";

type CreatedTenure = {
  id: string;
  label: string;
  startYear: number | null;
  endYear: number | null;
  order: number;
  isActive: boolean;
};

type Props = {
  onCreated: (item: CreatedTenure) => void;
};

export default function CreateTenureModal({ onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [order, setOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);

  const mutation = useMutation({
    mutationFn: async () => {
      return createTenure({
        label,
        startYear: startYear ? Number(startYear) : null,
        endYear: endYear ? Number(endYear) : null,
        order: Number(order) || 0,
        isActive,
      });
    },
    onSuccess: (data) => {
      toast.success("Tenure created successfully");
      onCreated(data);
      setLabel("");
      setStartYear("");
      setEndYear("");
      setOrder("0");
      setIsActive(true);
      setOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create tenure");
    },
  });

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-blue-600 hover:underline"
      >
        + Add Tenure
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Create Tenure</h2>
          <p className="text-sm text-muted-foreground">
            Add a new tenure option for committee members.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Label *</label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="2017-2019"
              className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Year</label>
              <input
                type="number"
                value={startYear}
                onChange={(e) => setStartYear(e.target.value)}
                placeholder="2017"
                className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-black/10"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">End Year</label>
              <input
                type="number"
                value={endYear}
                onChange={(e) => setEndYear(e.target.value)}
                placeholder="2019"
                className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-black/10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Order</label>
            <input
              type="number"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>

          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Active
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            disabled={mutation.isPending}
            className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {mutation.isPending ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}