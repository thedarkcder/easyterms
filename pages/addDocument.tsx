import { GetServerSidePropsContext } from 'next';
import {
  createServerSupabaseClient,
  User
} from '@supabase/auth-helpers-nextjs';

import { createDocument } from '@/utils/supabase-client';

import { useUser } from '@/utils/useUser';
import { UserDetails, Subscription } from 'types';

import { NextRouter, useRouter } from 'next/router';
import { v4 as uuidv4 } from 'uuid';

import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from 'langchain/embeddings';
import { PineconeStore } from 'langchain/vectorstores';
import { pinecone } from '@/utils/pinecone-client';
import { CustomPDFLoader } from '@/utils/customPDFLoader';
import { PINECONE_INDEX_NAME, PINECONE_NAME_SPACE } from '@/config/pinecone';
import { DirectoryLoader } from 'langchain/document_loaders';

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const supabase = createServerSupabaseClient(ctx);
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session)
    return {
      redirect: {
        destination: '/signin',
        permanent: false
      }
    };

  const { data } = await supabase
    .from('subscriptions')
    .select('*, prices(*, products(*))')
    .in('status', ['trialing', 'active'])
    .single();

  if (!data)
    return {
      redirect: {
        destination: '/pricing',
        permanent: false
      }
    };

  return {
    props: {
      initialSession: session,
      user: session.user
    }
  };
};

export default function Upload() {
  const { isLoading, subscription, userDetails } = useUser();

  const router = useRouter();

  return (
    <section className="bg-black mb-32">
      <div className="max-w-6xl mx-auto pt-8 sm:pt-24 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:flex-col sm:align-center">
          <h1 className="text-4xl font-extrabold text-white sm:text-center sm:text-6xl">
            Add new document
          </h1>
        </div>
      </div>

      <p>Upload a .pdf (max 10MB).</p>
      <input
        onChange={(e) => uploadPhoto(e, userDetails, router)}
        type="file"
        accept="application/pdf"
      />
    </section>
  );
}

const uploadPhoto = async (
  e: React.ChangeEvent<HTMLInputElement>,
  userDetails: UserDetails | null,
  router: NextRouter
) => {
  const file = e.target.files?.[0]!;
  const filename = encodeURIComponent(file.name);
  const fileType = encodeURIComponent(file.type);

  let myuuid = uuidv4();
  const key = 'user/' + userDetails?.id + '/' + myuuid;

  const res = await fetch(
    `/api/upload-url?key=${key}&fileType=${fileType}&user=${userDetails?.id}`
  );
  const { url, fields } = await res.json();
  const formData = new FormData();

  Object.entries({ ...fields, file }).forEach(([key, value]) => {
    formData.append(key, value as string);
  });

  const upload = await fetch(url, {
    method: 'POST',
    body: formData
  });

  if (upload.ok) {
    try {
      await createDocument({
        name: filename,
        user_id: userDetails?.id,
        namespace: myuuid
      });

      router.push('/documents');
    } catch (e) {
      console.error('Upload failed.', e);
    }
  } else {
    console.error('Upload failed.');
  }
};

const inject = async (file: File) => {
  try {
    /*load raw docs from the all files in the directory */
    //  const directoryLoader = new DirectoryLoader(filePath, {
    // '.pdf': (path) =>
    // new CustomPDFLoader(path),
    //  });

    const loader = new CustomPDFLoader(file);
    // const rawDocs = await directoryLoader.load();
    const rawDocs = await loader.load();

    /* Split text into chunks */
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200
    });

    const docs = await textSplitter.splitDocuments(rawDocs);
    console.log('split docs', docs);

    console.log('creating vector store...');
    /*create and store the embeddings in the vectorStore*/
    const embeddings = new OpenAIEmbeddings();
    const index = pinecone.Index(PINECONE_INDEX_NAME); //change to your own index name

    //embed the PDF documents
    await PineconeStore.fromDocuments(docs, embeddings, {
      pineconeIndex: index,
      namespace: PINECONE_NAME_SPACE,
      textKey: 'text'
    });
  } catch (error) {
    console.log('error', error);
    throw new Error('Failed to ingest your data');
  }
};
