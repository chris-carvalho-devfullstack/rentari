// src/components/layouts/Sidebar.tsx (ATUALIZAR LINKS)

// ... nos navItems
const navItems = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Imóveis', href: '/imoveis' },
  { name: 'Financeiro', href: '/financeiro' },
];
// ...

// ... no <Link>
// <Link href={`/(rentou)${item.href}`} // <-- INCORRETO
<Link 
  href={item.href} // <-- CORRETO: Apenas o nome da rota (e.g., /dashboard)
  className={`... ${isActive ? 'bg-blue-600...' : '...'}`}
>
// ...