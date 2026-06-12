import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { CircularProgress } from "@mui/material";
import { Add, Business, Close } from "@mui/icons-material";

import { ConfirmDialog } from "../../components/confirmDialog/ConfirmDialog";
import {
  useGetEntityHierarchyCandidatesQuery,
  useGetManageEntityHierarchyQuery,
  useGetPublicEntityHierarchyQuery,
  useRemoveEntityChildMutation,
  useRequestEntityChildMutation,
} from "../../services/api/endpoints/entityHierarchy/entityHierarchy.api";
import {
  EntityHierarchyCandidate,
  EntityHierarchyNode,
} from "../../services/api/endpoints/types/entityHierarchy.api.types";
import { useGetUserProfileQuery } from "../../services/api/endpoints/profiles/profiles.api";
import { useAppSelector } from "../../services/hooks";
import { selectCurrentUserId, selectUser } from "../users/selectors";
import { assetUrl } from "../../utils/assetUrl";

import styles from "./styles/entityHierarchy.module.css";

const getEntityName = (entity?: {
  organizationName?: string;
  nonprofitName?: string;
  fullName?: string;
}) =>
  entity?.organizationName ||
  entity?.nonprofitName ||
  entity?.fullName ||
  "Entity";

const getEntityTypeLabel = (userType?: string) =>
  userType === "nonprofit" ? "Non-Profit" : "Organization";

const getNodeCount = (nodes: EntityHierarchyNode[]): number =>
  nodes.reduce((total, node) => total + 1 + getNodeCount(node.children), 0);

const EntityNodeCard = ({
  node,
  canEdit,
  rootEntityId,
  onRemove,
}: {
  node: EntityHierarchyNode;
  canEdit: boolean;
  rootEntityId: string;
  onRemove: (node: EntityHierarchyNode) => void;
}) => {
  const isDirectChild = node.parentEntityId === rootEntityId;

  return (
    <li className={styles.hierarchyBranch}>
      <article className={styles.hierarchyNode}>
        <img
          src={node.profilePicture || assetUrl("/images/defaultProfilePicture.jpg")}
          alt=""
        />
        <div>
          <strong>{node.entityName}</strong>
          <span>{getEntityTypeLabel(node.userType)}</span>
          {node.status === "pending" && <em>Pending approval</em>}
        </div>
        {canEdit && isDirectChild && (
          <button
            type="button"
            className={styles.hierarchyRemoveButton}
            onClick={() => onRemove(node)}
            aria-label={`Remove ${node.entityName}`}
          >
            <Close fontSize="small" />
          </button>
        )}
      </article>
      {node.children.length > 0 && (
        <ul className={styles.hierarchyChildren}>
          {node.children.map((childNode) => (
            <EntityNodeCard
              key={childNode.id}
              node={childNode}
              canEdit={canEdit}
              rootEntityId={rootEntityId}
              onRemove={onRemove}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

export const EntityHierarchy = () => {
  const { entityId = "" } = useParams();
  const currentUserId = useAppSelector(selectCurrentUserId);
  const { user } = useAppSelector(selectUser);
  const currentUserIsEntity =
    user?.userType === "organization" || user?.userType === "nonprofit";
  const canEdit = Boolean(
    entityId && currentUserId === entityId && currentUserIsEntity
  );
  const [searchText, setSearchText] = useState("");
  const [draggedCandidate, setDraggedCandidate] =
    useState<EntityHierarchyCandidate | null>(null);
  const [candidateToAdd, setCandidateToAdd] =
    useState<EntityHierarchyCandidate | null>(null);
  const [nodeToRemove, setNodeToRemove] =
    useState<EntityHierarchyNode | null>(null);
  const [isRootDragOver, setIsRootDragOver] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const { data: rootProfile, isLoading: isLoadingProfile } =
    useGetUserProfileQuery(entityId, { skip: !entityId });
  const { data: publicHierarchy = [], isLoading: isLoadingPublic } =
    useGetPublicEntityHierarchyQuery(
      { rootEntityId: entityId },
      { skip: !entityId || canEdit }
    );
  const { data: managedHierarchy = [], isLoading: isLoadingManaged } =
    useGetManageEntityHierarchyQuery(
      { rootEntityId: entityId },
      { skip: !entityId || !canEdit }
    );
  const { data: candidates = [], isLoading: isLoadingCandidates } =
    useGetEntityHierarchyCandidatesQuery(
      { rootEntityId: entityId, searchText },
      { skip: !canEdit || !entityId }
    );
  const [requestEntityChild, { isLoading: isAddingChild }] =
    useRequestEntityChildMutation();
  const [removeEntityChild, { isLoading: isRemovingChild }] =
    useRemoveEntityChildMutation();
  const hierarchy = canEdit ? managedHierarchy : publicHierarchy;
  const isLoadingHierarchy =
    isLoadingProfile || (canEdit ? isLoadingManaged : isLoadingPublic);
  const rootEntity = rootProfile?.user;
  const rootName = getEntityName(rootEntity);
  const descendantCount = useMemo(() => getNodeCount(hierarchy), [hierarchy]);

  const handleDropOnRoot = () => {
    setIsRootDragOver(false);

    if (!draggedCandidate) return;

    setCandidateToAdd(draggedCandidate);
    setDraggedCandidate(null);
  };

  const handleConfirmAddChild = async () => {
    if (!candidateToAdd) return;

    try {
      await requestEntityChild({
        parentEntityId: entityId,
        childEntityId: candidateToAdd.id,
      }).unwrap();
      setStatusMessage(`${candidateToAdd.entityName} added as pending.`);
      setCandidateToAdd(null);
      setSearchText("");
    } catch (error) {
      console.error("Error adding hierarchy child", error);
      setStatusMessage("Unable to add this entity.");
    }
  };

  const handleConfirmRemoveChild = async () => {
    if (!nodeToRemove) return;

    try {
      await removeEntityChild({
        parentEntityId: entityId,
        childEntityId: nodeToRemove.id,
      }).unwrap();
      setStatusMessage(`${nodeToRemove.entityName} removed.`);
      setNodeToRemove(null);
    } catch (error) {
      console.error("Error removing hierarchy child", error);
      setStatusMessage("Unable to remove this entity.");
    }
  };

  return (
    <section className={styles.hierarchyPage}>
      <header className={styles.hierarchyHeader}>
        <div>
          <span>Entity Hierarchy</span>
          <h1>{rootName}</h1>
        </div>
        <p>
          {canEdit
            ? "Drag organizations and non-profits onto your entity to build your family tree."
            : "Explore this organization's public family tree."}
        </p>
      </header>

      <div className={styles.hierarchyLayout}>
        <div className={styles.hierarchyCanvas}>
          {isLoadingHierarchy ? (
            <div className={styles.hierarchyLoading}>
              <CircularProgress />
            </div>
          ) : (
            <div className={styles.hierarchyTree}>
              <article
                className={`${styles.hierarchyRootNode} ${
                  isRootDragOver ? styles.hierarchyRootNodeActive : ""
                }`}
                onDragOver={(event) => {
                  if (!canEdit || !draggedCandidate) return;
                  event.preventDefault();
                  setIsRootDragOver(true);
                }}
                onDragLeave={() => setIsRootDragOver(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  handleDropOnRoot();
                }}
              >
                <div className={styles.hierarchyRootIcon}>
                  {rootEntity?.profilePicture ? (
                    <img src={rootEntity.profilePicture} alt="" />
                  ) : (
                    <Business />
                  )}
                </div>
                <div>
                  <strong>{rootName}</strong>
                  <span>{getEntityTypeLabel(rootEntity?.userType)}</span>
                  <em>
                    {descendantCount}{" "}
                    {descendantCount === 1 ? "descendant" : "descendants"}
                  </em>
                </div>
              </article>

              {hierarchy.length > 0 ? (
                <ul className={styles.hierarchyChildren}>
                  {hierarchy.map((node) => (
                    <EntityNodeCard
                      key={node.id}
                      node={node}
                      canEdit={canEdit}
                      rootEntityId={entityId}
                      onRemove={setNodeToRemove}
                    />
                  ))}
                </ul>
              ) : (
                <p className={styles.hierarchyEmpty}>
                  No child organizations or non-profits yet.
                </p>
              )}
            </div>
          )}
        </div>

        {canEdit && (
          <aside className={styles.hierarchyCandidatePanel}>
            <h2>Add Child Entity</h2>
            <label>
              <span>Search Darbe entities</span>
              <input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search organizations or non-profits"
              />
            </label>
            <div className={styles.hierarchyCandidateList}>
              {isLoadingCandidates && <span>Loading...</span>}
              {!isLoadingCandidates && candidates.length === 0 && (
                <span>No available entities found.</span>
              )}
              {candidates.map((candidate) => (
                <button
                  type="button"
                  key={candidate.id}
                  className={styles.hierarchyCandidate}
                  draggable
                  onDragStart={() => setDraggedCandidate(candidate)}
                  onDragEnd={() => {
                    setDraggedCandidate(null);
                    setIsRootDragOver(false);
                  }}
                  onClick={() => setCandidateToAdd(candidate)}
                >
                  <img
                    src={
                      candidate.profilePicture ||
                      assetUrl("/images/defaultProfilePicture.jpg")
                    }
                    alt=""
                  />
                  <span>
                    <strong>{candidate.entityName}</strong>
                    <em>{getEntityTypeLabel(candidate.userType)}</em>
                  </span>
                  <Add fontSize="small" />
                </button>
              ))}
            </div>
          </aside>
        )}
      </div>

      {statusMessage && (
        <div className={styles.hierarchyToast} role="status">
          <span>{statusMessage}</span>
          <button type="button" onClick={() => setStatusMessage("")}>
            Close
          </button>
        </div>
      )}

      {candidateToAdd && (
        <ConfirmDialog
          title={`Add ${candidateToAdd.entityName}?`}
          message={`This will add ${candidateToAdd.entityName} under ${rootName}. Their existing child entities will come with them, and they will receive a notification to accept or reject.`}
          confirmLabel="Add"
          isLoading={isAddingChild}
          onConfirm={handleConfirmAddChild}
          onCancel={() => setCandidateToAdd(null)}
        />
      )}

      {nodeToRemove && (
        <ConfirmDialog
          title={`Remove ${nodeToRemove.entityName}?`}
          message={`This will remove ${nodeToRemove.entityName} from ${rootName}'s hierarchy.`}
          confirmLabel="Remove"
          isLoading={isRemovingChild}
          onConfirm={handleConfirmRemoveChild}
          onCancel={() => setNodeToRemove(null)}
        />
      )}
    </section>
  );
};
