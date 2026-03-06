import Link from "next/link";

type Setting = {
  id: string;
  key: string;
  value: unknown;
  createdAt: Date;
  updatedAt: Date;
};

export default function SiteSettingList({
  settings,
}: {
  settings: Setting[];
}) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Existing Settings</h2>
        <Link
          href="/admin/site-settings/home-page-slider"
          className="rounded-lg border px-3 py-2 text-sm hover:bg-muted"
        >
          New
        </Link>
      </div>

      {settings.length === 0 ? (
        <p className="text-sm text-muted-foreground">No settings created yet.</p>
      ) : (
        <div className="space-y-3">
          {settings.map((item) => (
            <Link
              key={item.id}
              href={`/admin/site-settings?edit=${item.id}`}
              className="block rounded-xl border p-3 transition hover:bg-muted/40"
            >
              <div className="font-medium">{item.key}</div>
              <div className="mt-1 line-clamp-3 text-xs text-muted-foreground">
                {JSON.stringify(item.value)}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}