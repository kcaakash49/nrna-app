"use client";

import { createEventCategory } from "@/actions/events/event-category";
import { toast } from "sonner";


type ParentOption = { id: string; name: string };

export default function CategoryCreateForm({ parentOptions }: { parentOptions: ParentOption[] }) {

  return (
    <form
      className="rounded-2xl border bg-white p-4 space-y-4"
      action={async (fd) => {
        
        const res = await createEventCategory(fd);
        if (!res.ok) {
          toast.error(res.error || "Failed to create category!!!")
          return;
        }
        toast.success(`Created category: ${res.category?.name}` || "Category Created Successfully!!!")
       
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Name</span>
          <input name="name" className="rounded-xl border px-3 py-2" placeholder="e.g. Conferences" />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Slug (optional)</span>
          <input name="slug" className="rounded-xl border px-3 py-2" placeholder="auto from name" />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Parent (optional)</span>
          <select name="parentId" defaultValue="" className="rounded-xl border px-3 py-2">
            <option value="">— No parent (root) —</option>
            {parentOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <span className="text-xs text-gray-500">
            Select a parent to create a subcategory.
          </span>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Order</span>
          <input name="order" type="number" defaultValue={0} className="rounded-xl border px-3 py-2" />
          <span className="text-xs text-gray-500">Lower number = shows earlier.</span>
        </label>
      </div>

      <label className="flex items-center gap-2">
        <input name="isActive" type="checkbox" defaultChecked />
        <span className="text-sm">Active</span>
      </label>

      <div className="flex justify-end">
        <button className="rounded-xl bg-black text-white px-4 py-2">Create Category</button>
      </div>
    </form>
  );
}