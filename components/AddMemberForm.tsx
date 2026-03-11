"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type AddMemberFormProps = {
  initialTenures: { id: string; label: string }[];
  initialTeamTypes: { id: string; name: string }[];
  initialGroups: { id: string; name: string }[];
};

export default function AddMemberForm({
  initialTenures,
  initialTeamTypes,
  initialGroups,
}: AddMemberFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [tenures] = useState(initialTenures);
  const [teamTypes] = useState(initialTeamTypes);
  const [groups] = useState(initialGroups);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("");
  const [country, setCountry] = useState("");
  const [tenureId, setTenureId] = useState("");
  const [teamTypeId, setTeamTypeId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [order, setOrder] = useState("100");
  const [isActive, setIsActive] = useState(true);

  const canSubmit = useMemo(() => {
    return (
      name.trim() &&
      designation.trim() &&
      tenureId &&
      teamTypeId &&
      groupId
    );
  }, [name, designation, tenureId, teamTypeId, groupId]);

  const mutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();

      formData.append("name", name);
      formData.append("designation", designation);
      formData.append("country", country);
      formData.append("tenureId", tenureId);
      formData.append("teamTypeId", teamTypeId);
      formData.append("groupId", groupId);
      formData.append("order", order);
      formData.append("isActive", String(isActive));

      if (imageFile) {
        formData.append("image", imageFile);
      }

      const res = await fetch("/api/admin/committee-members/create", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Failed to create committee member");
      }

      return json;
    },

    onSuccess: () => {
      toast.success("Committee member created successfully");

      queryClient.invalidateQueries({
        queryKey: ["committee-members"],
      });

      router.push("/admin/committee-members");
      router.refresh();
    },

    onError: (error: any) => {
      toast.error(error.message || "Something went wrong");
    },
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!canSubmit) {
      toast.error("Please fill all required fields");
      return;
    }

    mutation.mutate();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Add Committee Member
          </h1>
          <p className="text-sm text-muted-foreground">
            Create a new committee member record.
          </p>
        </div>

        <Link
          href="/admin/committee-members"
          className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Back
        </Link>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border bg-white p-5 shadow-sm"
      >
        <div className="grid gap-5 md:grid-cols-2">
          
          {/* NAME */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border px-3 py-2"
            />
          </div>

          {/* DESIGNATION */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Designation *</label>
            <input
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              className="w-full rounded-xl border px-3 py-2"
            />
          </div>

          {/* COUNTRY */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Country</label>
            <input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full rounded-xl border px-3 py-2"
            />
          </div>

          {/* IMAGE */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Member Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setImageFile(file);
              }}
              className="w-full rounded-xl border px-3 py-2"
            />
          </div>

          {/* TENURE */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Tenure *</label>
            <select
              value={tenureId}
              onChange={(e) => setTenureId(e.target.value)}
              className="w-full rounded-xl border px-3 py-2"
            >
              <option value="">Select tenure</option>
              {tenures.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* TEAM TYPE */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Team Type *</label>
            <select
              value={teamTypeId}
              onChange={(e) => setTeamTypeId(e.target.value)}
              className="w-full rounded-xl border px-3 py-2"
            >
              <option value="">Select team type</option>
              {teamTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* GROUP */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Group *</label>
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="w-full rounded-xl border px-3 py-2"
            >
              <option value="">Select group</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* ORDER */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Order</label>
            <input
              type="number"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              className="w-full rounded-xl border px-3 py-2"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <label className="text-sm font-medium">Active</label>
        </div>

        <button
          type="submit"
          disabled={!canSubmit || mutation.isPending}
          className="rounded-xl bg-black px-4 py-2 text-white"
        >
          {mutation.isPending ? "Creating..." : "Create Member"}
        </button>
      </form>
    </div>
  );
}