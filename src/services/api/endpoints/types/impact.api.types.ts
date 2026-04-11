import { ShortEventState } from "./events.api.types";

export interface EventImpact {
    id: string;
    impactType: "individual" | "group";
    hoursVolunteered: number;
    volunteerValue: number;
    event: ShortEventState
}
