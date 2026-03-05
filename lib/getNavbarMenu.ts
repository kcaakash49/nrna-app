import { prisma } from "@/lib/prisma";

export async function getNavbarMenu(menuKey: string) {
    console.log("Fetching Navbar menus");
  const menu = await prisma.menu.findFirst({
    where: {
      key: menuKey,
      isActive: true,
    },
    include: {
      items: {
        where: {
          isActive: true,
          visibility: "PUBLIC",
        },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!menu) return [];

  const items = menu.items;

  // collect reference ids
  const postIds = items
    .filter((i) => i.kind === "POST_PAGE")
    .map((i) => i.refId)
    .filter((id): id is string => Boolean(id));

  const eventIds = items
    .filter((i) => i.kind === "EVENT")
    .map((i) => i.refId)
    .filter((id): id is string => Boolean(id));

  const categoryIds = items
    .filter((i) => i.kind === "EVENT_CATEGORY")
    .map((i) => i.refId)
    .filter((id): id is string => Boolean(id));

  const posts = postIds.length
    ? await prisma.post.findMany({
        where: { id: { in: postIds } },
        select: { id: true, slug: true },
      })
    : [];

  const events = eventIds.length
    ? await prisma.event.findMany({
        where: { id: { in: eventIds } },
        select: { id: true, slug: true },
      })
    : [];

  const categories = categoryIds.length
    ? await prisma.eventCategory.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true, slug: true },
      })
    : [];

  const postMap = new Map(posts.map((p) => [p.id, p]));
  const eventMap = new Map(events.map((e) => [e.id, e]));
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  const resolveHref = (item: any) => {
    if (item.kind === "URL") return item.url;

    if (item.kind === "POST_PAGE") {
      const post = postMap.get(item.refId);
      return post ? `/posts/${post.slug}` : "#";
    }

    if (item.kind === "EVENT") {
      const event = eventMap.get(item.refId);
      return event ? `/events/${event.slug}` : "#";
    }

    if (item.kind === "EVENT_CATEGORY") {
      const category = categoryMap.get(item.refId);
      return category ? `/events/category/${category.slug}` : "#";
    }

    return "#";
  };

  const withHref = items.map((item) => ({
    ...item,
    href: resolveHref(item),
  }));

  // build tree
  const map = new Map();
  const roots: any[] = [];

  withHref.forEach((item) => {
    map.set(item.id, { ...item, children: [] });
  });

  map.forEach((item) => {
    if (item.parentId) {
      map.get(item.parentId)?.children.push(item);
    } else {
      roots.push(item);
    }
  });

  return roots;
}
