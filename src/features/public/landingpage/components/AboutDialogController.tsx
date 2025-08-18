// FILE: \features\public\landingpage\components\AboutDialogController.tsx
// DESCRIPTION: Controls when the About modal opens/closes based on the URL (when ?about=1 is in the URL, the modal opens).
'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import AboutDialog from '@/features/public/landingpage/components/AboutDialog';
import AboutContent from '@/features/public/landingpage/components/AboutContent';

export default function AboutDialogController() {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams(); //Get about parameter from the URL
  const open = search.get('about') === '1';

  //Close Function
  function close() {
    const params = new URLSearchParams(search.toString());
    params.delete('about');
    const url = params.toString() ? `${pathname}?${params}` : pathname;
    router.replace(url, { scroll: false }); // keep history clean
  }

  return (
    // Will display the AboutDialog based on the value of "open"
    <AboutDialog open={open} onClose={close} title="About Us">
      <AboutContent />
    </AboutDialog>
  );
}
