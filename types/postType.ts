import { $Enums } from "@prisma/client"

export type CreatePostType = {
    type: $Enums.PostType;
    status:$Enums.PostStatus;
    lang:$Enums.Language;
    title: string;
    slug: string | null;
    excerpt?: string | null;
    content: string;
    coverMediaId?: string | null;
    ogMediaId?: string | null;
    isFeatured: boolean;
    isPinned: boolean;
    translationGroupId?: string;
    metaTitle?: string;
    metaDescription?: string;
    pageTemplate: $Enums.PageTemplate | null;
    attachmentMediaIds: string[];
}