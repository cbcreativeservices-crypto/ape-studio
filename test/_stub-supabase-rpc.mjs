/** Stand-in for src/lib/supabase whose rpc() answers from a test-supplied
 *  handler: globalThis.__RPC__ = (name, args) => ({ data, error }). */
export const supabase = {
  async rpc(name, args) {
    const handler = globalThis.__RPC__;
    if (typeof handler !== 'function') throw new Error('no __RPC__ handler installed');
    return handler(name, args);
  },
};
