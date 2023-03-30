import { useRouter } from 'next/router';
import cn from 'classnames';
import Link from 'next/link';

import Button from '@/components/ui/Button';

import { useUser } from '@/utils/useUser';

import { ChatDocument } from 'types';
import s from 'ui/Navbar/Navbar.module.css';

interface Props {
  documents: ChatDocument[];
}

export default function Documents({ documents }: Props) {
  const router = useRouter();
  const { user, isLoading, subscription } = useUser();

  const loadDocument = async (document: ChatDocument) => {
    router.push({
      pathname: '/documents',
      query: { n: document.namespace }
    });
  };

  if (!documents.length)
    return (
      <section className="bg-black">
        <div className="max-w-6xl mx-auto py-8 sm:py-24 px-4 sm:px-6 lg:px-8">
          <div className="sm:flex sm:flex-col sm:align-center"></div>
          <p className="text-6xl font-extrabold text-white sm:text-center sm:text-6xl">
            No documents uploaded
            <Link href="/signin" className={s.link}>
              Upload
            </Link>
            .
          </p>
        </div>
      </section>
    );

  return (
    <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0 xl:grid-cols-4">
      {documents.map((document) => {
        return (
          <div
            key={document.namespace}
            className={cn(
              'rounded-lg shadow-sm divide-y divide-zinc-600 bg-zinc-900'
            )}
          >
            <div className="p-6">
              <h2 className="text-2xl leading-6 font-semibold text-white">
                {document.name}
              </h2>
              <p className="mt-4 text-zinc-300">{document.created_at}</p>

              <Button
                variant="slim"
                type="button"
                disabled={isLoading}
                onClick={() => loadDocument(document)}
                className="mt-8 block w-full rounded-md py-2 text-sm font-semibold text-white text-center hover:bg-zinc-900"
              >
                {document.name}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
