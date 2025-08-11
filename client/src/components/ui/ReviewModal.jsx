import { useState } from 'react';

export function ReviewModal({ isOpen, onClose, onSubmit, stageName, medicineId }) {
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [flags, setFlags] = useState({
    lateDelivery: false,
    poorCondition: false,
    wrongQuantity: false,
    temperatureIssue: false,
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      medicineId,
      stageName,
      rating,
      review,
      flags,
      timestamp: Date.now(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Review {stageName}</h2>
        
        <form onSubmit={handleSubmit}>
          {/* Rating */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-2xl ${
                    star <= rating ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* Flags */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Issues</label>
            <div className="space-y-2">
              {Object.entries(flags).map(([key, value]) => (
                <label key={key} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) =>
                      setFlags((prev) => ({
                        ...prev,
                        [key]: e.target.checked,
                      }))
                    }
                    className="mr-2"
                  />
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                </label>
              ))}
            </div>
          </div>

          {/* Review Text */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Comments</label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              className="w-full p-2 border rounded"
              rows="3"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Submit Review
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
