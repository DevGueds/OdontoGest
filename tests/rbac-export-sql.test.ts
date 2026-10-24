async function runTests() {
  console.log('--- Testing /api/export/sql RBAC ---');

  // 1. Unauthenticated test
  const resUnauth = await fetch('http://localhost:3001/api/export/sql');
  console.log('1. Unauthenticated request: status =', resUnauth.status);
  if (resUnauth.status !== 401) {
    throw new Error(`Expected 401, got ${resUnauth.status}`);
  }

  // 2. Solicitante login & attempt
  const loginSol = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'solicitante@saude.gov.br', senha: '123456' })
  });
  const cookieSol = loginSol.headers.get('set-cookie');
  if (!cookieSol) throw new Error('Could not get session cookie for Solicitante');

  const resSol = await fetch('http://localhost:3001/api/export/sql', {
    headers: { 'Cookie': cookieSol.split(';')[0] }
  });
  const solBody = await resSol.json();
  console.log('2. Solicitante request: status =', resSol.status, 'body =', JSON.stringify(solBody));
  if (resSol.status !== 403) {
    throw new Error(`Expected 403 for Solicitante, got ${resSol.status}`);
  }

  // 3. Admin login & attempt
  const loginAdmin = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@saude.gov.br', senha: '123456' })
  });
  const cookieAdmin = loginAdmin.headers.get('set-cookie');
  if (!cookieAdmin) throw new Error('Could not get session cookie for Admin');

  const resAdmin = await fetch('http://localhost:3001/api/export/sql', {
    headers: { 'Cookie': cookieAdmin.split(';')[0] }
  });
  const textAdmin = await resAdmin.text();
  console.log('3. Admin request: status =', resAdmin.status, 'bytes =', textAdmin.length);
  if (resAdmin.status !== 200 || !textAdmin.includes('DUMP')) {
    throw new Error(`Expected 200 and SQL dump content for Admin, got ${resAdmin.status}`);
  }

  console.log('>>> ALL RBAC BACKEND CHECKS PASSED SUCCESSFULLY! <<<');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
