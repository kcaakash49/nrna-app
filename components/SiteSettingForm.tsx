"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteSiteSetting, upsertSiteSetting } from "@/actions/site-settings/actions";


type InitialData = {
  id: string;
  key: string;
  value: unknown;
} | null;

export default function SiteSettingForm({
  initialData,
}: {
  initialData: InitialData;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [key, setKey] = useState(initialData?.key || "");
  const [value, setValue] = useState(
  initialData ? JSON.stringify(initialData.value, null, 2) : "{\n\n}"
);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const onSubmit = async (formData: FormData) => {
    setError("");
    setSuccess("");

    startTransition(async () => {
      const res = await upsertSiteSetting(formData);

      if (!res.ok) {
        setError(res.error || "Failed to save");
        return;
      }

      setSuccess("Setting saved successfully");

      if (!initialData) {
        setKey("");
        setValue("{\n\n}")
      }

      router.push("/admin/site-settings");
      router.refresh();
    });
  };

  const onDelete = async () => {
    if (!initialData?.id) return;
    const confirmed = window.confirm("Delete this setting?");
    if (!confirmed) return;

    setError("");
    setSuccess("");

    const fd = new FormData();
    fd.append("id", initialData.id);

    startTransition(async () => {
      const res = await deleteSiteSetting(fd);

      if (!res.ok) {
        setError(res.error || "Failed to delete");
        return;
      }

      router.push("/admin/site-settings");
      router.refresh();
    });
  };

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold">
        {initialData ? "Edit Setting" : "Create Setting"}
      </h2>

      <form action={onSubmit} className="space-y-4">
        <input type="hidden" name="id" value={initialData?.id || ""} />

        <div className="space-y-2">
          <label className="text-sm font-medium">Key</label>
          <input
            name="key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="homepage_mou_slider"
            className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2"
          />
          <p className="text-xs text-muted-foreground">
            Use stable keys like <code>site_contact</code> or{" "}
            <code>homepage_mou_slider</code>.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">JSON Value</label>
          <textarea
            name="value"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={16}
            spellCheck={false}
            className="w-full rounded-xl border px-3 py-3 font-mono text-sm outline-none focus:ring-2"
            placeholder={`{\n  "imageIds": ["id1", "id2"]\n}`}
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {success ? <p className="text-sm text-green-600">{success}</p> : null}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl bg-black px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            {isPending ? "Saving..." : initialData ? "Update" : "Create"}
          </button>

          {initialData ? (
            <button
              type="button"
              onClick={onDelete}
              disabled={isPending}
              className="rounded-xl border border-red-300 px-4 py-2 text-sm text-red-600 disabled:opacity-60"
            >
              Delete
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}