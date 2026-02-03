'use client';
import Image from "next/image";

interface PhotoUploadProps {
  photos: string[];
  onChange: (photos: string[]) => void;
}

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export default function PhotoUpload({ photos, onChange }: PhotoUploadProps) {
  function handleAddPhoto() {
    const input = prompt('Enter photo URL (http/https):');
    const photoUrl = (input || '').trim();
    if (photoUrl && isValidHttpUrl(photoUrl)) {
      onChange([...photos, photoUrl]);
      return;
    }
    if (photoUrl) {
      alert('Please enter a valid http/https URL.');
    }
  }

  function handleRemovePhoto(index: number) {
    onChange(photos.filter((_, i) => i !== index));
  }

  return (
    <div className="border-2 border-dashed border-gray-300 rounded p-4">
      <label className="block text-sm font-medium mb-2">Photos</label>
      <p className="text-sm text-gray-600 mb-3">
        Upload photos of the damage (feature-flagged)
      </p>

      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          {photos.map((photo, index) => (
            <div
              key={photo}
              className="relative bg-gray-100 rounded overflow-hidden group"
            >
              <div className="aspect-square w-full bg-gray-200 relative">
                <Image
                  src={photo}
                  alt={`Damage photo ${index + 1}`}
                  className="object-cover"
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  referrerPolicy="no-referrer"
                  unoptimized
                />
              </div>

              <div className="p-2">
                <p className="text-xs text-gray-700 truncate" title={photo}>
                  {photo}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleRemovePhoto(index)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove photo"
                title="Remove photo"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={handleAddPhoto}
        className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium"
      >
        + Add Photo
      </button>
    </div>
  );
}
