"use client";

import dynamic from 'next/dynamic';

const X402Dashboard = dynamic(() => import('@/components/X402Dashboard'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
      <div className="text-white">Loading dashboard...</div>
    </div>
  ),
});

export default function Home() {
  return <X402Dashboard />;
}
