import {NotFound} from 'components/content/QueryState';

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

export class NotFoundError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'NotFound';
  }
}
