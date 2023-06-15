export class NotFoundError extends Error {
  pretty: string;
  constructor(message?: string, pretty?: string) {
    super(message);
    this.name = 'NotFound';
    this.pretty = pretty ? pretty : 'the requested resource';
  }
}
