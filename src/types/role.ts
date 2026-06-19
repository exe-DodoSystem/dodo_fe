export interface RoleDto {
  id: number;
  name: string;
  description: string;
  isSystemRole: boolean;
}

export interface RoleListResponse {
  items: RoleDto[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}
