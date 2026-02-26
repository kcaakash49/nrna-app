import { fetchParentCategories } from "@/actions/events/event-category";
import CategoryCreateForm from "@/components/CreateCatogoryForm";
import Link from "next/link";


export default async function EventCategoriesPage() {
  // Fetch parents + children in one DB call
  const { result: parents } = await fetchParentCategories();

  // For the parent dropdown, we can include both parents and children if you want,
  // but for now: allow selecting any parent (root only is typical).
  const parentOptions = parents.map((p) => ({ id: p.id, name: p.name }));

  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Event Categories</h1>
          <Link href="/admin/events" className="text-sm underline">
            Back to Events
          </Link>
        </div>

        {/* Top Create Form */}
        <CategoryCreateForm parentOptions={parentOptions} />

        {/* List Table */}
        <div className="rounded-2xl bg-white overflow-hidden">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="font-medium">Categories</div>
            <div className="text-sm text-gray-500">
              Parent categories can be expanded to show subcategories.
            </div>
          </div>

          <div className="divide-y">
            {parents.length === 0 ? (
              <div className="p-6 text-sm text-gray-600">No categories yet.</div>
            ) : (
              
                parents.map((p) => (
                  <div key={p.id} className="rounded-2xl border bg-white p-4 m-2">
                    {/* Parent header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-3">
                          <div className="font-semibold truncate">{p.name}</div>
                          <span className="text-xs rounded-full border px-2 py-0.5 text-gray-600">{p.slug}</span>
                          {!p.isActive ? (
                            <span className="text-xs rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">Inactive</span>
                          ) : null}
                        </div>

                        <div className="mt-1 text-xs text-gray-500">
                          Order: {p.order} • {p.children.length} subcategories
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/events/categories/${p.id}/edit`}
                          className="rounded-lg border px-3 py-1 text-sm"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          disabled
                          className="rounded-lg border px-3 py-1 text-sm opacity-50 cursor-not-allowed"
                          title="Delete action will be added later"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Children section ONLY if there are children */}
                    {p.children.length > 0 ? (
                      <details className="mt-4">
                        <summary className="cursor-pointer text-sm text-gray-700 select-none">
                          View subcategories ({p.children.length})
                        </summary>

                        <div className="mt-3 rounded-xl border bg-gray-50 p-3 space-y-2">
                          {p.children.map((c) => (
                            <div key={c.id} className="flex items-center justify-between rounded-lg bg-white border p-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <div className="font-medium truncate">{c.name}</div>
                                  <span className="text-xs rounded-full border px-2 py-0.5 text-gray-600">{c.slug}</span>
                                  {!c.isActive ? (
                                    <span className="text-xs rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">Inactive</span>
                                  ) : null}
                                </div>
                                <div className="mt-1 text-xs text-gray-500">Order: {c.order}</div>
                              </div>

                              <div className="flex items-center gap-2">
                                <Link
                                  href={`/admin/events/categories/${c.id}/edit`}
                                  className="rounded-lg border px-3 py-1 text-sm"
                                >
                                  Edit
                                </Link>
                                <button
                                  type="button"
                                  disabled
                                  className="rounded-lg border px-3 py-1 text-sm opacity-50 cursor-not-allowed"
                                  title="Delete action will be added later"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </details>
                    ) : null}
                  </div>
                ))
              
            )}
          </div>
        </div>
      </div>
    </div>
  );
}