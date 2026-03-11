import AddMemberForm from "@/components/AddMemberForm";
import { prisma } from "@/lib/prisma";


export default async function NewCommitteeMemberPage() {
  const [tenures, teamTypes, groups] = await Promise.all([
    prisma.tenure.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        label: true,
      },
    }),
    prisma.teamType.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        name: true,
      },
    }),
    prisma.committeeGroup.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        name: true,
      },
    }),
  ]);

  return (
    <div className="p-4 md:p-6">
      <AddMemberForm
        initialTenures={tenures}
        initialTeamTypes={teamTypes}
        initialGroups={groups}
      />
    </div>
  );
}