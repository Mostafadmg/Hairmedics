/**
 * A tiny observable store (the Observer pattern).
 *
 * - State lives in ONE place (single source of truth).
 * - The only way to change it is dispatch(action) -> reducer(state, action).
 * - Anything that cares (header count, drawer, basket page) subscribes and
 *   re-renders when the state changes. Components never talk to each other.
 *
 *   const store = createStore({ count: 0 }, (state, action) => …);
 *   store.subscribe(state => render(state));
 *   store.dispatch({ type: 'increment' });
 */
export function createStore(initialState, reducer) {
  let state = initialState;
  const listeners = new Set();

  return {
    getState: () => state,

    dispatch(action) {
      const next = reducer(state, action);
      if (next !== state) {
        state = next;
        listeners.forEach(listener => listener(state, action));
      }
      return action;
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener); // call to unsubscribe
    },
  };
}
