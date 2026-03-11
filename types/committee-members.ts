export type CommitteeMemberListItem = {
  id: string;
  name: string;
  imageUrl: string | null;
  designation: string;
  country: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  tenure: {
    id: string;
    label: string;
  };
  teamType: {
    id: string;
    name: string;
  };
  group: {
    id: string;
    name: string;
  };
};

export type CommitteeMembersResponse = {
  ok: boolean;
  data: CommitteeMemberListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  error?: string;
};