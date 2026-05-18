import { AsyncLocalStorage } from "async_hooks";

interface RequestContext {
  requestId: string;
}

const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

export const getContext = () => asyncLocalStorage.getStore();

export const runWithContext = (context: RequestContext, fn: () => void) => {
  asyncLocalStorage.run(context, fn);
};
