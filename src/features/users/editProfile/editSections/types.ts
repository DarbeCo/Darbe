export interface EditProfileProps {
  userId: string;
}

export interface EditEntityProfileProps extends EditProfileProps {
  entityType?: string;
}
