// src/pages/users/components/ActionModal.tsx
import React from 'react';
import { AlertTriangle, Ban, UserX, ShieldCheck, Mail } from 'lucide-react';

interface ActionModalProps {
  open: boolean;
  type: 'suspend' | 'ban' | 'approve-seller' | 'approve-email';
  user: any;
  onClose: () => void;
  onConfirm: () => void;
}

const ActionModal: React.FC<ActionModalProps> = ({ open, type, user, onClose, onConfirm }) => {
  if (!open || !user) return null;

  const config = {
    suspend: { 
      title: 'Suspend User', 
      icon: UserX, 
      bgColor: 'bg-yellow-100', 
      textColor: 'text-yellow-600',
      buttonBg: 'bg-yellow-600',
      buttonHover: 'hover:bg-yellow-700',
      message: 'suspend this user' 
    },
    ban: { 
      title: 'Ban User', 
      icon: Ban, 
      bgColor: 'bg-red-100', 
      textColor: 'text-red-600',
      buttonBg: 'bg-red-600',
      buttonHover: 'hover:bg-red-700',
      message: 'permanently ban this user' 
    },
    'approve-seller': { 
      title: 'Approve Instant Seller', 
      icon: ShieldCheck, 
      bgColor: 'bg-emerald-100', 
      textColor: 'text-emerald-600',
      buttonBg: 'bg-emerald-600',
      buttonHover: 'hover:bg-emerald-700',
      message: 'approve this user as an Instant Seller' 
    },
    'approve-email': { 
      title: 'Approve Email', 
      icon: Mail, 
      bgColor: 'bg-blue-100', 
      textColor: 'text-blue-600',
      buttonBg: 'bg-blue-600',
      buttonHover: 'hover:bg-blue-700',
      message: 'approve this user\'s email address' 
    },
  }[type];

  const Icon = config.icon;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center animate-fadeIn">
        <div className={`w-16 h-16 ${config.bgColor} rounded-full mx-auto flex items-center justify-center`}>
          <Icon className={`w-8 h-8 ${config.textColor}`} />
        </div>

        <h3 className="text-2xl font-bold text-gray-900 mt-6">{config.title}</h3>
        <p className="text-gray-600 mt-3">
          Are you sure you want to <span className="font-semibold">{config.message}</span>?
        </p>
        <p className="mt-2 text-lg font-medium text-gray-900">
          {user.name || user.email}
        </p>

        <div className="flex gap-4 mt-8">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 py-3 ${config.buttonBg} text-white rounded-lg ${config.buttonHover} transition font-medium`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActionModal;