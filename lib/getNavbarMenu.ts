import {prisma} from "@/lib/prisma";

type MenuNode = any;

export async function getNavbarMenu(menuKey: string) {
  console.log("Fetching Menu Items");
  const menu = await prisma.menu.findFirst({
    where: { key: menuKey, isActive: true },
    include: {
      items: {
        where: { isActive: true, visibility: "PUBLIC" },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!menu) return [];

  const items = menu.items;

  // ---- Collect refIds (typed as string[]) ----
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

  const [posts, singleEvents] = await Promise.all([
    postIds.length
      ? prisma.post.findMany({
          where: { id: { in: postIds } },
          select: { id: true, slug: true },
        })
      : Promise.resolve([]),
    eventIds.length
      ? prisma.event.findMany({
          where: { id: { in: eventIds } },
          select: { id: true, slug: true },
        })
      : Promise.resolve([]),
  ]);

  const postMap = new Map(posts.map((p) => [p.id, p]));
  const eventMap = new Map(singleEvents.map((e) => [e.id, e]));

  // ---- Resolve href for base menu items ----
  // NOTE: No category pages in your app, so EVENT_CATEGORY has no href.
  const resolveHref = (item: any): string | null => {
    if (item.kind === "URL") return item.url || null;

    if (item.kind === "POST_PAGE") {
      const post = postMap.get(item.refId);
      return post ? `/posts/${post.slug}` : null;
    }

    if (item.kind === "EVENT") {
      const ev = eventMap.get(item.refId);
      return ev ? `/events/${ev.slug}` : null;
    }

    if (item.kind === "EVENT_CATEGORY") return null;

    return null;
  };

  const withHref = items.map((item) => ({
    ...item,
    href: resolveHref(item),
  }));

  // ---- Build normal menu tree from MenuItem table ----
  const map = new Map<string, MenuNode>();
  const roots: MenuNode[] = [];

  withHref.forEach((item) => {
    map.set(item.id, { ...item, children: [] });
  });

  map.forEach((node) => {
    if (node.parentId) map.get(node.parentId)?.children.push(node);
    else roots.push(node);
  });

  if (categoryIds.length) {
    const MAX_EVENTS = 5;

    // Load only ACTIVE categories and all events in those categories + subcats
    const allCategories = await prisma.eventCategory.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true, parentId: true, order: true },
      orderBy: [{ parentId: "asc" }, { order: "asc" }],
    });

    const catById = new Map(allCategories.map((c) => [c.id, c]));

    // children map (we only use 1 level deep)
    const childrenByParent = new Map<string, any[]>();
    for (const c of allCategories) {
      if (!c.parentId) continue;
      const arr = childrenByParent.get(c.parentId) ?? [];
      arr.push(c);
      childrenByParent.set(c.parentId, arr);
    }

    // Collect all category ids we need events for:
    // selected parent categories + their direct children
    const neededCategoryIds = new Set<string>();
    for (const rootId of categoryIds) {
      neededCategoryIds.add(rootId);
      const subs = childrenByParent.get(rootId) ?? [];
      for (const sc of subs) neededCategoryIds.add(sc.id);
    }

    // Fetch events in those categories
    // NOTE: add your correct "published only" filter later if needed.
    const scopedEvents = await prisma.event.findMany({
      where: { categoryId: { in: Array.from(neededCategoryIds) } },
      select: { id: true, title: true, slug: true, categoryId: true, startDateTime: true },
      orderBy: { startDateTime: "desc" },
    });

    const eventsByCategoryId = new Map<string, any[]>();
    for (const e of scopedEvents) {
      if (!e.categoryId) continue;
      const arr = eventsByCategoryId.get(e.categoryId) ?? [];
      arr.push(e);
      eventsByCategoryId.set(e.categoryId, arr);
    }

    const makeEventNodes = (evs: any[]): MenuNode[] =>
      evs.slice(0, MAX_EVENTS).map((ev) => ({
        id: `event:${ev.id}`,
        label: ev.title,
        href: `/events/${ev.slug}`,
        kind: "EVENT",
        children: [],
      }));

    const makeViewAll = (catSlug?: string): MenuNode => ({
      id: `viewall:${catSlug ?? "all"}`,
      label: "View all events",
      href: "/events", // later: `/events?category=${catSlug}`
      kind: "URL",
      children: [],
    });

    const buildExpandedChildrenForCategory = (catId: string): MenuNode[] => {
      const cat = catById.get(catId);
      if (!cat) return [];

      // 1) Direct subcategories (one level only)
      const subcats = (childrenByParent.get(cat.id) ?? []).sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0)
      );

      const subcatNodes: MenuNode[] = subcats.map((sc) => {
        const scEvents = eventsByCategoryId.get(sc.id) ?? [];
        const children: MenuNode[] = [
          ...makeEventNodes(scEvents),
          ...(scEvents.length > MAX_EVENTS ? [makeViewAll(sc.slug)] : []),
        ];

        return {
          id: `cat:${sc.id}`,
          label: sc.name,
          href: null, // no category page
          kind: "EVENT_CATEGORY",
          children,
        };
      });

      // 2) Events directly under the parent category
      const catEvents = eventsByCategoryId.get(cat.id) ?? [];
      const catEventNodes: MenuNode[] = [
        ...makeEventNodes(catEvents),
        ...(catEvents.length > MAX_EVENTS ? [makeViewAll(cat.slug)] : []),
      ];

      // Subcategories first, then the category's own events
      return [...subcatNodes, ...catEventNodes];
    };

    const expandInPlace = (nodes: MenuNode[]) => {
      for (const n of nodes) {
        if (n.kind === "EVENT_CATEGORY" && n.refId) {
          n.href = null; // ensure no navigation
          n.children = buildExpandedChildrenForCategory(n.refId);
        }
        if (n.children?.length) expandInPlace(n.children);
      }
    };

    expandInPlace(roots);
  }

  return roots;
}