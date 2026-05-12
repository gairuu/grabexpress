'use client';
import dynamic from 'next/dynamic';
import { MapProps } from './MapComponent';

const DynamicMap = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[300px] bg-gray-100 animate-pulse rounded-xl flex items-center justify-center">
      <span className="text-gray-400 font-medium">Loading map...</span>
    </div>
  ),
});

export default function Map(props: MapProps) {
  return <DynamicMap {...props} />;
}
