/* Role navigation reuses the active Supabase session; it never requests another code. */
(async () => {
  const auth = await window.CrystalinaAuth;
  const user = await auth.currentUser();
  if (!user) return;
  const routes = { admin: '/admin/', manager: '/manager/', technician: '/technician/', sales: '/sales/' };
  const available = user.roles.filter(role => routes[role]);
  if (!available.length) return;
  const active = Object.entries(routes).find(([, path]) => location.pathname.startsWith(path))?.[0];
  const nav = document.createElement('nav');
  nav.className = 'role-switcher';
  nav.setAttribute('aria-label', 'Staff role switcher');
  nav.innerHTML = `<label for="roleSwitcher">View as</label><select id="roleSwitcher">${available.map(role => `<option value="${role}" ${role === active ? 'selected' : ''}>${role[0].toUpperCase() + role.slice(1)}</option>`).join('')}</select>`;
  nav.querySelector('select').addEventListener('change', event => { location.href = routes[event.target.value]; });
  document.body.prepend(nav);
})();
