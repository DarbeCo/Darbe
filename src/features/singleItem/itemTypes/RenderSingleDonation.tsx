interface RenderSingleDonationProps {
  userId: string;
  donationId: string;
}

// TODO: Fill me out once post a donation cards are done
export const RenderSingleDonation = ({
  userId,
  donationId,
}: RenderSingleDonationProps) => {
  return (
    <div>
      {" "}
      Rendering donation {donationId} viewed by {userId}
    </div>
  );
};
