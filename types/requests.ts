export type NotFound = {
  notFound: string;
};

export function notFound(what: string): NotFound {
  return {notFound: what};
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isNotFound(obj: NotFound | any): obj is NotFound {
  return obj && (obj as NotFound).notFound !== undefined;
}
