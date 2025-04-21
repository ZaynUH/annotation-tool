import { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/upload',
      permanent: false, // change to true if it's a permanent redirect
    },
  };
};

export default function Home() {
  return null; // this won't render because of the redirect
}
