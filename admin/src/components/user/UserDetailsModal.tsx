// src/pages/users/components/UserDetailsModal.tsx
import { XCircle, Calendar, Shield } from 'lucide-react';
import { User } from '../../pages/Users';

interface UserDetailsModalProps {
  user: User | null;
  open: boolean;
  onClose: () => void;
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({ user, open, onClose }) => {
  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-5 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">User Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircle className="w-7 h-7" />
          </button>
        </div>

        <div className="p-8 space-y-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
              {(user.name || user.email)[0].toUpperCase()}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{user.name || 'Unknown User'}</h3>
              <p className="text-gray-600">{user.email}</p>
              <p className="text-sm text-gray-500 mt-1">
                Joined <Calendar className="w-4 h-4 inline" /> {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-xl p-5">
              <p className="text-sm font-medium text-gray-600">Account Status</p>
              <p className="mt-2 text-lg font-semibold text-green-600 capitalize">{user.accountStatus}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-5">
              <p className="text-sm font-medium text-gray-600">Role</p>
              <p className="mt-2 text-lg font-semibold capitalize">{user.role.replace('_', ' ')}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-5">
              <p className="text-sm font-medium text-gray-600">KYC Status</p>
              <p className="mt-2 text-lg font-semibold capitalize">{user.kycStatus.replace('_', ' ')}</p>
              {user.kycLevel && <p className="text-sm text-gray-500">Level: {user.kycLevel.toUpperCase()}</p>}
            </div>
            <div className="bg-gray-50 rounded-xl p-5">
              <p className="text-sm font-medium text-gray-600">Instant Seller</p>
              <p className="mt-2 text-lg font-semibold">{user.isInstantSeller ? 'Yes' : 'No'}</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6">
            <h4 className="font-bold text-lg mb-4">Trading Activity</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold text-indigo-600">{user.totalTrades}</p>
                <p className="text-sm text-gray-600">Total Trades</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-green-600">{user.completedTrades}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-yellow-600">{user.averageRating.toFixed(1)}</p>
                <p className="text-sm text-gray-600">Rating</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;