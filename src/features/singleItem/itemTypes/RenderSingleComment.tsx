interface RenderSingleCommentProps {
    userId: string;
    commentId: string;
  }
  
  // TODO: Fill me out once we figure out what a single comment looks like?
  export const RenderSingleComment = ({
    userId,
    commentId,
  }: RenderSingleCommentProps) => {
    return (
      <div>
        {" "}
        Rendering comment {commentId} viewed by {userId}
      </div>
    );
  };
  