export type FileIntoAction = {
  type: "fileinto";
  folder: string;
  create?: boolean;
  stop?: boolean;
};

export type RedirectAction = {
  type: "redirect";
  address: string;
  copy?: boolean;
  stop?: boolean;
};

export type KeepAction = {
  type: "keep";
  stop?: boolean;
};

export type DiscardAction = {
  type: "discard";
  stop?: boolean;
};

export type Action = FileIntoAction | RedirectAction | KeepAction | DiscardAction;