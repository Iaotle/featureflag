'use client';

interface PhotoUploadProps {
  photos: string[];
  onChange: (photos: string[]) => void;
}

export default function PhotoUpload({ photos, onChange }: PhotoUploadProps) {
  function handleAddPhoto() {
    const photoUrl = prompt('Enter photo URL or filename:');
    if (photoUrl) {
      onChange([...photos, photoUrl]);
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
            <div key={index} className="relative bg-gray-100 p-3 rounded group">
              <p className="text-sm truncate">{photo}</p>
              <button
                type="button"
                onClick={() => handleRemovePhoto(index)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
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
