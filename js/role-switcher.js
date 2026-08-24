/* Role navigation reuses the active Supabase session; it never requests another code. */
(async () => {
  let user;
  try {
    const auth = await window.CrystalinaAuth;
    user = await auth.currentUser();
  } catch (error) {
    console.error('Unable to load staff dashboard roles.', error);
    return;
  }
  if (!user) return;
  const routes = { admin: '/admin/', manager: '/manager/', technician: '/technician/', sales: '/sales/' };
  const labels = { admin: 'Admin', manager: 'Manager', technician: 'Technician', sales: 'Sales' };
  const available = user.roles.filter(role => routes[role]);
  if (available.length < 2) return;
  const active = Object.entries(routes).find(([, path]) => location.pathname.startsWith(path))?.[0];
  const nav = document.createElement('nav');
  nav.className = 'role-switcher';
  nav.setAttribute('aria-label', 'Switch staff dashboard');
  nav.innerHTML = `<label for="roleSwitcher">Dashboard</label><select id="roleSwitcher">${available.map(role => `<option value="${role}" ${role === active ? 'selected' : ''}>${labels[role]}</option>`).join('')}</select>`;
  nav.querySelector('select').addEventListener('change', event => { location.href = routes[event.target.value]; });
  const portalUser = document.querySelector('.portal-user');
  if (portalUser) {
    portalUser.insertBefore(nav, portalUser.lastElementChild);
    return;
  }
  const adminMain = document.querySelector('.admin-main');
  if (adminMain) {
    const toolbar = document.createElement('div');
    toolbar.className = 'admin-role-toolbar';
    toolbar.appendChild(nav);
    adminMain.prepend(toolbar);
  }
})();
