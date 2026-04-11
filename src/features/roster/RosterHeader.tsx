import { DarbeButton } from "../../components/buttons/DarbeButton";
import { Dropdown } from "../../components/dropdowns/Dropdown";
import { Rosters } from "../../components/dropdowns/dropdownTypes/Rosters";

import styles from "./styles/roster.module.css";

interface RosterHeaderProps {
  onRosterChange: (rosterName: string) => void;
  rosterNames?: string[];
  selectedRoster?: string;
  onNewRoster: () => void;
}

export const RosterHeader = ({
  onRosterChange,
  rosterNames,
  selectedRoster,
  onNewRoster,
}: RosterHeaderProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onRosterChange(e.target.value);
  };

  const handleClick = () => {
    onNewRoster();
  };

  let rosterOptions = Rosters(rosterNames || []);

  return (
    <div className={styles.rosterHeader}>
      <Dropdown
        name="rosterDropdown"
        label=""
        autoWidth={false}
        initialValue={selectedRoster}
        onChange={handleChange}
        variant="rosterDropdown"
      >
        {rosterOptions}
      </Dropdown>
      <DarbeButton
        darbeButtonType="rosterButton"
        buttonText="New Roster"
        endingIconPath="/svgs/common/addIcon.svg"
        onClick={handleClick}
      />
    </div>
  );
};
