export interface SystemTenantDto {
  id: string;
  name: string;
  status: string;                       // "Active" | "Suspended" | "Expired" | ...
  subscriptionEndDate: string | null;   // "YYYY-MM-DD" — không có timezone
  ownerUserId: string;
  createdAt: string;                    // UTC ISO string
  updatedAt: string;                    // UTC ISO string
}

export interface TenantListResponse {
  items: SystemTenantDto[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}
