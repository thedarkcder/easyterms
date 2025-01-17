import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

import Logo from '@/components/icons/Logo';
import { useUser } from '@/utils/useUser';

import s from './Navbar.module.css';

const Navbar = () => {
  const router = useRouter();
  const supabaseClient = useSupabaseClient();
  const { user, subscription } = useUser();

  return (
    <nav className={s.root}>
      <a href="#skip" className="sr-only focus:not-sr-only">
        Skip to content
      </a>
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex justify-between align-center flex-row py-4 md:py-6 relative">
          <div className="flex flex-1 items-center">
            {!user ? (
              <Link href="/" className={s.logo} aria-label="Logo">
                <Logo />
              </Link>
            ) : (
              <Link href="/account" className={s.logo} aria-label="Logo">
               <Logo />
              </Link>
            )}

            <nav className="space-x-2 ml-6 hidden lg:block">
              {!subscription ? (
                <Link href="/" className={s.link}>
                  Pricing
                </Link>
              ) : (
                <>
                <Link href="/documents" className={s.link}>
                  Documents
                </Link>
             
               </>

              )}
              <Link href="/account" className={s.link}>
                Account
              </Link>

              <Link href="/addDocument" className={s.link}>
                Add document
               </Link>
            </nav>
          </div>

          <div className="flex flex-1 justify-end space-x-8">
            {subscription && (
              <Link href="/documents" className={s.link}>
                Documents
              </Link>
            )}

            {user ? (
              <span
                className={s.link}
                onClick={async () => {
                  await supabaseClient.auth.signOut();
                  router.push('/signin');
                }}
              >
                Sign out
              </span>
            ) : (
              <Link href="/signin" className={s.link}>
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
