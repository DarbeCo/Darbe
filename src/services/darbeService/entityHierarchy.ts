import {
  EntityHierarchyCandidate,
  EntityHierarchyNode,
  EntityHierarchyStatus,
} from "../api/endpoints/types/entityHierarchy.api.types";
import { supabase } from "../supabase/client";

type EntityHierarchyRow = {
  id: string;
  parent_entity_id: string;
  child_entity_id: string;
  status: EntityHierarchyStatus;
  depth: number;
  entity_id: string;
  entity_name: string;
  profile_picture_url: string | null;
  user_type: string;
};

type EntityHierarchyCandidateRow = {
  id: string;
  entity_name: string;
  profile_picture_url: string | null;
  user_type: string;
};

const callRpc = supabase.rpc.bind(supabase) as unknown as (
  fn: string,
  args?: Record<string, unknown>
) => Promise<{ data: unknown; error: unknown }>;

const mapCandidate = (
  row: EntityHierarchyCandidateRow
): EntityHierarchyCandidate => ({
  id: row.id,
  entityName: row.entity_name,
  profilePicture: row.profile_picture_url ?? undefined,
  userType: row.user_type,
});

const buildHierarchyTree = (
  rootEntityId: string,
  rows: EntityHierarchyRow[]
): EntityHierarchyNode[] => {
  const nodeMap = new Map<string, EntityHierarchyNode>();

  rows.forEach((row) => {
    nodeMap.set(row.child_entity_id, {
      id: row.child_entity_id,
      hierarchyId: row.id,
      parentEntityId: row.parent_entity_id,
      entityName: row.entity_name,
      profilePicture: row.profile_picture_url ?? undefined,
      userType: row.user_type,
      status: row.status,
      children: [],
    });
  });

  const roots: EntityHierarchyNode[] = [];

  rows.forEach((row) => {
    const node = nodeMap.get(row.child_entity_id);
    if (!node) return;

    const parent = nodeMap.get(row.parent_entity_id);

    if (parent) {
      parent.children.push(node);
      return;
    }

    if (row.parent_entity_id === rootEntityId) {
      roots.push(node);
    }
  });

  const sortNodes = (nodes: EntityHierarchyNode[]) => {
    nodes.sort((first, second) =>
      first.entityName.localeCompare(second.entityName)
    );
    nodes.forEach((node) => sortNodes(node.children));
  };

  sortNodes(roots);

  return roots;
};

export const getPublicEntityHierarchy = async (
  rootEntityId: string
): Promise<EntityHierarchyNode[]> => {
  const { data, error } = await callRpc("get_public_entity_hierarchy", {
    root_entity_id: rootEntityId,
  });

  if (error) throw error;

  return buildHierarchyTree(
    rootEntityId,
    (data ?? []) as EntityHierarchyRow[]
  );
};

export const getManageEntityHierarchy = async (
  rootEntityId: string
): Promise<EntityHierarchyNode[]> => {
  const { data, error } = await callRpc("get_manage_entity_hierarchy", {
    root_entity_id: rootEntityId,
  });

  if (error) throw error;

  return buildHierarchyTree(
    rootEntityId,
    (data ?? []) as EntityHierarchyRow[]
  );
};

export const getEntityHierarchyCandidates = async ({
  rootEntityId,
  searchText,
}: {
  rootEntityId: string;
  searchText?: string;
}): Promise<EntityHierarchyCandidate[]> => {
  const { data, error } = await callRpc(
    "get_entity_hierarchy_candidates",
    {
      root_entity_id: rootEntityId,
      search_text: searchText ?? "",
    }
  );

  if (error) throw error;

  return ((data ?? []) as EntityHierarchyCandidateRow[]).map(mapCandidate);
};

export const requestEntityChild = async ({
  parentEntityId,
  childEntityId,
}: {
  parentEntityId: string;
  childEntityId: string;
}): Promise<string> => {
  const { data, error } = await callRpc("request_entity_child", {
    target_parent_entity_id: parentEntityId,
    target_child_entity_id: childEntityId,
  });

  if (error) throw error;

  return data as string;
};

export const acceptEntityChildRequest = async (
  hierarchyId: string
): Promise<void> => {
  const { error } = await callRpc("accept_entity_child_request", {
    hierarchy_id: hierarchyId,
  });

  if (error) throw error;
};

export const rejectEntityChildRequest = async (
  hierarchyId: string
): Promise<void> => {
  const { error } = await callRpc("reject_entity_child_request", {
    hierarchy_id: hierarchyId,
  });

  if (error) throw error;
};

export const removeEntityChild = async ({
  parentEntityId,
  childEntityId,
}: {
  parentEntityId: string;
  childEntityId: string;
}): Promise<void> => {
  const { error } = await callRpc("remove_entity_child", {
    target_parent_entity_id: parentEntityId,
    target_child_entity_id: childEntityId,
  });

  if (error) throw error;
};
