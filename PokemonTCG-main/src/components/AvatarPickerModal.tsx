'use client';
import { useState, useEffect } from 'react';

export default function AvatarPickerModal({
  isOpen,
  onClose,
  onSave,
  currentAvatar,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (url: string) => void;
  currentAvatar: string;
}) {
  const [selected, setSelected] = useState(currentAvatar);

  const avatars = [
    'https://i.pinimg.com/564x/59/40/1c/59401cad1047716d7a916cae339dbf6b.jpg', // Ash
    'https://preview.redd.it/put-my-avatar-in-a-misty-costume-for-halloween-v0-ewqonnongywd1.jpg?width=640&crop=smart&auto=webp&s=4e087c62f463302167a9199e38ea368d9e878485', // Misty
    'https://imagedelivery.net/LBWXYQ-XnKSYxbZ-NuYGqQ/fee497b1-bf1e-44d0-b99c-ab256e6b8d00/avatarhd', // Brock
    'https://cdn.costumewall.com/wp-content/uploads/2016/10/serena-pokemon-costume.jpg', // Serena
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRsX070csr2Qhcc4sIfOG5M6L8zLiAExUA6vA&s', // Gary
    'https://i.pinimg.com/736x/64/68/8d/64688d41df504d52071fd84852356ecb.jpg', // Professor Oak
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1BL3FlC2xopRJ43DV2hCy1VtkPqS0eGKtIw&s', // Nurse Joy
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ5ymgO-66nRZS9gcstj6Dp5ayW61hRTnIu-w&s', // Meow meow
    'https://image1.gamme.com.tw/news2/2016/05/77/qZqYnaSYk6Kap6Q.jpg', // Musashi
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQIwG39-AGz0YIc4wZsP-Y65yiBzXYS-H43dA&s', // James
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQRH_keIoiDLL1bfJF2ZGTvFA6BvTvneJIFWAdafOurP_3qxj9qmWnoZIqMT97bnZtlkJU&usqp=CAU', // Wobbuffet
  ];

  // Reset selection when modal re-opens
  useEffect(() => {
    if (isOpen) {
      setSelected(currentAvatar);
    }
  }, [isOpen, currentAvatar]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-yellow-500 rounded-lg p-6 max-w-md w-full">
        <h2 className="text-yellow-300 text-xl font-semibold mb-4">
          Choose Your Avatar
        </h2>
        <div className="flex flex-wrap gap-4 justify-center mb-4">
          {avatars.map((url) => (
            <button
              key={url}
              onClick={() => setSelected(url)}
              className={`rounded-full focus:outline-none transition duration-200 ${
                selected === url ? 'ring-4 ring-yellow-400' : ''
              }`}
            >
              <img
                src={url}
                alt="Avatar"
                className="w-20 h-20 rounded-full object-cover"
              />
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 rounded text-yellow-200"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave(selected);
              onClose();
            }}
            className="px-4 py-2 bg-yellow-500 text-black rounded"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
