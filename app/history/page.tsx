import { HistoryWizard } from '../components/history-wizard';

type SearchParams = {
  searchParams?: Promise<Record<string, string | string[]>>;
};

export default async function HistoryPage({ searchParams }: SearchParams) {
  const params = await searchParams;
  const code = typeof params?.code === 'string' ? params.code : undefined;
  const email = typeof params?.email === 'string' ? params.email : undefined;

  return (
    <main>
      <HistoryWizard code={code} email={email} />
    </main>
  );
}
