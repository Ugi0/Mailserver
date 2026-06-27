import type { Action } from "./action";

export type MatchType = "contains" | "is" | "matches";

export type RuleField = "from" | "to" | "cc" | "subject" | "header";

export type FilterRule = {
  name: string;
  field: RuleField;
  match: MatchType;
  value: string;

  action: Action;

  header?: string;
  enabled?: boolean;
  id?: number;
};