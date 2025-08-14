'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import AboutDialog from '@/components/AboutDialog';
import AboutContent from '@/components/AboutContent';

export default function AboutDialogController() {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const open = search.get('about') === '1';

  function close() {
    const params = new URLSearchParams(search.toString());
    params.delete('about');
    const url = params.toString() ? `${pathname}?${params}` : pathname;
    router.replace(url, { scroll: false }); // keep history clean
  }

  return (
    <AboutDialog open={open} onClose={close} title="About Us">
      <AboutContent />
    </AboutDialog>
  );
}
