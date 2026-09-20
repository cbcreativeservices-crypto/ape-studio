/** Stand-in for src/lib/supabase in pure-logic tests — no RPC is called. */
export const supabase = {
  async rpc() {
    throw new Error('supabase.rpc must not be reached by this test');
  },
};
