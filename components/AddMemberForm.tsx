"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import CreateTenureModal from "./CreateTenureModal";
import CreateCommitteeMetaModal from "./CreateCommitteeMetaModal";


type AddMemberFormProps = {
  initialTenures: {
    id: string;
    label: string;
    startYear?: number | null;
    endYear?: number | null;
    order?: number;
    isActive?: boolean;
  }[];
  initialTeamTypes: {
    id: string;
    name: string;
    order?: number;
    isActive?: boolean;
  }[];
  initialGroups: {
    id: string;
    name: string;
    order?: number;
    isActive?: boolean;
  }[];
};

export default function AddMemberForm({
  initialTenures,
  initialTeamTypes,
  initialGroups,
}: AddMemberFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [tenures, setTenures] = useState(initialTenures);
  const [teamTypes, setTeamTypes] = useState(initialTeamTypes);
  const [groups, setGroups] = useState(initialGroups);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("");
  const [country, setCountry] = useState("");
  const [tenureId, setTenureId] = useState("");
  const [teamTypeId, setTeamTypeId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [order, setOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);

  const canSubmit = useMemo(() => {
    return !!(
      name.trim() &&
      designation.trim() &&
      imageFile &&
      tenureId &&
      teamTypeId &&
      groupId
    );
  }, [name, designation, imageFile, tenureId, teamTypeId, groupId]);

  const mutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("designation", designation.trim());
      formData.append("country", country.trim());
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
    onError: (error: Error) => {
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
          <div className="space-y-2">
            <label className="text-sm font-medium">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-black/10"
              placeholder="Enter member name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Designation *</label>
            <input
              type="text"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-black/10"
              placeholder="Enter designation"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Country</label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-black/10"
              placeholder="Enter country"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Member Photo *</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setImageFile(file);
              }}
              className="w-full rounded-xl border px-3 py-2"
            />
            <p className="text-xs text-muted-foreground">
              Image will be converted to WebP automatically.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-medium">Tenure *</label>
              <CreateTenureModal
                onCreated={(item) => {
                  setTenures((prev) =>
                    [...prev, item].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                  );
                  setTenureId(item.id);
                }}
              />
            </div>
            <select
              value={tenureId}
              onChange={(e) => setTenureId(e.target.value)}
              className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-black/10"
            >
              <option value="">Select tenure</option>
              {tenures.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            {tenures.length === 0 ? (
              <p className="text-xs text-red-600">
                No tenure found. Create one first.
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-medium">Team Type *</label>
              <CreateCommitteeMetaModal
                type="teamType"
                onCreated={(item) => {
                  setTeamTypes((prev) =>
                    [...prev, item].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                  );
                  setTeamTypeId(item.id);
                }}
              />
            </div>
            <select
              value={teamTypeId}
              onChange={(e) => setTeamTypeId(e.target.value)}
              className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-black/10"
            >
              <option value="">Select team type</option>
              {teamTypes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            {teamTypes.length === 0 ? (
              <p className="text-xs text-red-600">
                No team type found. Create one first.
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-medium">Group *</label>
              <CreateCommitteeMetaModal
                type="group"
                onCreated={(item) => {
                  setGroups((prev) =>
                    [...prev, item].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                  );
                  setGroupId(item.id);
                }}
              />
            </div>
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-black/10"
            >
              <option value="">Select group</option>
              {groups.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            {groups.length === 0 ? (
              <p className="text-xs text-red-600">
                No group found. Create one first.
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Order</label>
            <input
              type="number"
              min={0}
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            id="isActive"
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <label htmlFor="isActive" className="text-sm font-medium">
            Active
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!canSubmit || mutation.isPending}
            className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {mutation.isPending ? "Creating..." : "Create Member"}
          </button>

          <Link
            href="/admin/committee-members"
            className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}