import type { FilterRule } from "./filterRule";

export type ApplySieveRequest = {
  email: string;
  filters: FilterRule[];
  autoreply?: {
    enabled: boolean;
    subject: string;
    message: string;
    days: number;
  };
};
