import { fetchArtemisData } from '@/lib/sheets';
import X402Dashboard from '@/components/X402Dashboard';

// ISR: Revalidate every 24 hours (86400 seconds)
export const revalidate = 86400;

export default async function Home() {
  let artemisData = null;
  let error = null;

  try {
    artemisData = await fetchArtemisData();
  } catch (e) {
    console.error('Failed to fetch Artemis data:', e);
    error = 'Failed to load live data';
  }

  return <X402Dashboard artemisData={artemisData} error={error} />;
}
