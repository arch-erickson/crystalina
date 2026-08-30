/* ============================================================
   Crystalina, shared Supabase browser client.
   Publishable (anon) key only. Never place a service-role key here:
   every privileged mutation goes through the /api server boundary.
   ============================================================ */
window.CrystalinaSupabase = (() => {
  const SUPABASE_URL = 'https://ucrmebgsbkfizxthngbi.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable__MsHfs2prmqv5qthXwFjhA_pmQi10Fg';

  let clientPromise = null;
  function client() {
    if (!clientPromise) {
      clientPromise = import('https://esm.sh/@supabase/supabase-js@2.95.3')
        .then(({ createClient }) => createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
          auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
        }));
    }
    return clientPromise;
  }

  // REST fallback for read-only public data when the SDK module cannot load.
  async function restGet(path) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}` }
    });
    if (!res.ok) throw new Error(`Supabase REST ${res.status}`);
    return res.json();
  }

  return { url: SUPABASE_URL, publishableKey: SUPABASE_PUBLISHABLE_KEY, client, restGet };
})();
