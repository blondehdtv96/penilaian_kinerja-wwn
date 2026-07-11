// Reproduksi error "Access denied" pada halaman Kinerja Saya operator.
const BASE = 'http://localhost:3001/api';

async function main() {
  const loginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'operator01', password: 'operator123' }),
  });
  const login = await loginRes.json();
  console.log('LOGIN status=', loginRes.status, '| role=', login?.data?.user?.role);
  const token = login?.data?.token;
  if (!token) { console.log('Gagal login:', JSON.stringify(login)); return; }

  const auth = { Authorization: `Bearer ${token}` };

  const p = await fetch(`${BASE}/operators/my-profile`, { headers: auth });
  console.log('GET /operators/my-profile =>', p.status, (await p.json())?.message ?? 'OK');

  const v = await fetch(`${BASE}/voo/my`, { headers: auth });
  console.log('GET /voo/my =>', v.status, (await v.json())?.message ?? 'OK');
}

main().catch((e) => { console.error('ERR', e.message); process.exit(1); });
