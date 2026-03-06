import SiteSettingForm from "@/components/SiteSettingForm";
import SiteSettingList from "@/components/SiteSettingList";
import { prisma } from "@/lib/prisma";

type Props = {
  searchParams: Promise<{ edit?: string }>;
};

export default async function SiteSettingsPage({ searchParams }: Props) {
  const { edit } = await searchParams;

  const settings = await prisma.siteSetting.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      key: true,
      value: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const selected = edit
    ? await prisma.siteSetting.findUnique({
        where: { id: edit },
        select: {
          id: true,
          key: true,
          value: true,
        },
      })
    : null;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Site Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage global website settings using key + JSON value.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <SiteSettingList settings={settings} />
        <SiteSettingForm initialData={selected} />
      </div>
    </div>
  );
}