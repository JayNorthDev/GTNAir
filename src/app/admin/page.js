
// This file is deprecated in favor of page.tsx. 
// Please use src/app/admin/page.tsx for playlist management.
import { redirect } from 'next/navigation';

export default function DeprecatedAdminPage() {
  redirect('/admin');
}
