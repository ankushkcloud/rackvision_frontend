'use client';

import { useQuery } from '@tanstack/react-query';
import { discoveryApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface Props {
  sessionId: string;
  onClose: () => void;
}

export default function DiscoveryResults({
  sessionId,
  onClose,
}: Props) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['discovery-session', sessionId],
    queryFn: async () => {
      const res = await discoveryApi.getSessionDetails(sessionId);
      return res.data;
    },
    enabled: !!sessionId,
    retry: false,
  });

  const session = data?.session;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
        <div className="text-white text-lg">
          Loading discovery results...
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex flex-col items-center justify-center gap-4">
        <h2 className="text-red-400 text-xl font-bold">
          Session not found
        </h2>

        <button
          onClick={onClose}
          className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg"
        >
          Back
        </button>
      </div>
    );
  }

  const handleImport = (device: any) => {
    toast.success(`Import feature ready for ${device.ip}`);
  };

  return (
    <div className="min-h-screen bg-[#0f1117] text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">
            Discovery Results
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Network Range: {session.networkRange}
          </p>
        </div>

        <button
          onClick={onClose}
          className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg"
        >
          Close
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-[#161b27] border border-gray-800 rounded-xl p-4">
          <p className="text-sm text-gray-400">Total Found</p>
          <p className="text-2xl font-bold text-green-400">
            {session.totalFound || 0}
          </p>
        </div>

        <div className="bg-[#161b27] border border-gray-800 rounded-xl p-4">
          <p className="text-sm text-gray-400">Online</p>
          <p className="text-2xl font-bold text-blue-400">
            {session.onlineCount || 0}
          </p>
        </div>

        <div className="bg-[#161b27] border border-gray-800 rounded-xl p-4">
          <p className="text-sm text-gray-400">Imported</p>
          <p className="text-2xl font-bold text-purple-400">
            {session.importedCount || 0}
          </p>
        </div>
      </div>

      {/* Device List */}
      <div className="bg-[#161b27] border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold">
            Discovered Devices
          </h2>
        </div>

        {!session.devices || session.devices.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No devices found
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {session.devices.map((device: any, index: number) => (
              <div
                key={index}
                className="p-4 flex items-center justify-between hover:bg-gray-900/40"
              >
                <div className="flex-1">
                  <div className="font-semibold text-white">
                    {device.hostname || device.ip}
                  </div>

                  <div className="text-sm text-gray-400 mt-1">
                    IP: {device.ip}
                  </div>

                  <div className="text-sm text-gray-500 mt-1">
                    MAC: {device.mac || 'N/A'} | Vendor: {device.vendor || 'Unknown'}
                  </div>

                  <div className="text-sm text-gray-500 mt-1">
                    Type: {device.deviceType || 'Unknown'}
                  </div>
                </div>

                <button
                  onClick={() => handleImport(device)}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm"
                >
                  Import
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}