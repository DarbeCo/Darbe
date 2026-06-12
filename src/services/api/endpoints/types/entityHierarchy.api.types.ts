export type EntityHierarchyStatus = "pending" | "accepted";

export interface EntityHierarchyNode {
  id: string;
  hierarchyId?: string;
  parentEntityId?: string;
  entityName: string;
  profilePicture?: string;
  userType: string;
  status: EntityHierarchyStatus;
  children: EntityHierarchyNode[];
}

export interface EntityHierarchyCandidate {
  id: string;
  entityName: string;
  profilePicture?: string;
  userType: string;
}
