'use client';

import { useEffect, useState } from 'react';
import { getUserId } from '@/lib/flags';

export default function UserInfo() {
  const [userId, setUserId] = useState<string>('');
  const [userGroup, setUserGroup] = useState<string>('');

  useEffect(() => {
    const id = getUserId();
    setUserId(id);

    // Calculate user group using the same CRC32 logic as backend
    const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const hash = crc32(id);
    const group = groups[Math.abs(hash) % 8];
    setUserGroup(group);
  }, []);

  // Simple CRC32 implementation (matches PHP's crc32)
  function crc32(str: string): number {
    let crc = 0 ^ -1;
    for (let i = 0; i < str.length; i++) {
      crc = (crc >>> 8) ^ crc32Table[(crc ^ str.charCodeAt(i)) & 0xff];
    }
    return (crc ^ -1) >>> 0;
  }

  function handleResetUser() {
    if (confirm('Reset your user ID? This will assign you to a new group.')) {
      localStorage.removeItem('feature_flag_user_id');
      window.location.reload();
    }
  }

  return (
    <div className="bg-slate-800 text-white px-4 py-3 shadow-md">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-slate-300 text-sm font-medium">User ID:</span>
            <code className="bg-slate-700 px-2 py-1 rounded text-sm font-mono text-blue-300">
              {userId.slice(0, 8)}...
            </code>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-300 text-sm font-medium">Group:</span>
            <span className="bg-blue-600 px-3 py-1 rounded-full text-sm font-bold">
              {userGroup}
            </span>
          </div>
        </div>
        <button
          onClick={handleResetUser}
          className="text-sm bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded transition-colors"
          title="Get a new user ID and group assignment"
        >
          Reset User
        </button>
      </div>
    </div>
  );
}

// CRC32 lookup table
const crc32Table = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crc32Table[i] = c;
}
