export interface NewPostBody {
  posterId: string;
  postText: string;
  files: string[] | null;
}
