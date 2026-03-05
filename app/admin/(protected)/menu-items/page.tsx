import MenuItemCreateForm from "@/components/MenuItemForm";
import {prisma} from "@/lib/prisma";


export default async function NewMenuItemPage() {
  const menus = await prisma.menu.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, key: true },
  });

  // fetch all menu items for parent selection (we'll filter client-side by menuId)
  const menuItems = await prisma.menuItem.findMany({
    orderBy: [{ menuId: "asc" }, { parentId: "asc" }, { order: "asc" }],
    select: { id: true, label: true, menuId: true, parentId: true,kind:true },
  });

  // Only PAGE posts (best for navbar)
  const pagePosts = await prisma.post.findMany({
    where: { type: "PAGE" },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, slug: true, lang: true },
  });

  const events = await prisma.event.findMany({
    orderBy: { startDateTime: "desc" },
    select: { id: true, title: true, slug: true, lang: true, status: true },
  });

  const eventCategories = await prisma.eventCategory.findMany({
    orderBy: [{ parentId: "asc" }, { order: "asc" }],
    select: { id: true, name: true, slug: true, parentId: true },
  });

  return (
    <MenuItemCreateForm
      menus={menus}
      menuItems={menuItems}
      pagePosts={pagePosts}
      events={events}
      eventCategories={eventCategories}
    />
  );
}