interface SimpleCauseDisplayProps {
  externalData: any;
}

export const SimpleCauseDisplay = ({
  externalData,
}: SimpleCauseDisplayProps) => {
  return (
    <div>
      {externalData.map((cause: any) => (
        <div key={cause}>
          <p>{cause}</p>
        </div>
      ))}
    </div>
  );
};
