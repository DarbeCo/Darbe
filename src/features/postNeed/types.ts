import { Dispatch, SetStateAction } from "react";

import { CreateEvent } from "../../services/api/endpoints/types/events.api.types";

export interface EventFormCommonProps {
  eventType: string;
  data: CreateEvent;
  onChange?: Dispatch<SetStateAction<CreateEvent>>;
  markError: (hasError: boolean) => void;
}
