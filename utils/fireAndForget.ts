import {Logger} from 'browser-bunyan';

import {logger as defaultLogger} from 'logger';

// Some APIs (e.g. PostHog's v4 client) return a Promise from methods we want to call in a
// fire-and-forget fashion. Using the `void` operator on those promises silences the floating-promise
// lint, but it also swallows any rejection silently. `fireAndForget` keeps the call fire-and-forget
// while attaching a `.catch` so that an unexpected rejection is logged instead of disappearing.
export function fireAndForget(promise: Promise<unknown> | undefined, message = 'fire-and-forget promise rejected', logger: Logger = defaultLogger): void {
  void promise?.catch((error: unknown) => {
    logger.error({error}, message);
  });
}
