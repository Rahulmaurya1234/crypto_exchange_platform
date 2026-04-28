import React, { useState, useMemo } from 'react';
import { 
  MessageSquare, UserCheck, Clock, CheckCircle2, Search,
  Shield, Headset, MessageCircle
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Tab, Tabs, TabContent } from '../components/common/Tabs';
import { 
  useGetSupportStatsQuery, 
  useGetAllSupportTicketsQuery, 
  useGetMyTicketsQuery,
  useJoinSupportChatMutation
} from '../store/api/supportApi';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { toast } from 'react-toastify';

interface SupportTicket {
  _id: string;
  reason: string;
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: string;
  chatId?: string;
  assignedTo?: string;
  tradeId?: {
    _id: string;
    tradeNumber: string;
    buyerId?: { name: string; email: string };
    sellerId?: { name: string; email: string };
  };
}

export const Support: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: statsData, isLoading: isLoadingStats } = useGetSupportStatsQuery();
  const { data: allTicketsData, isLoading: isLoadingAll, refetch: refetchAll } = useGetAllSupportTicketsQuery({ page: 1, limit: 100 });
  const { data: myTicketsData, isLoading: isLoadingMy, refetch: refetchMy } = useGetMyTicketsQuery({ page: 1, limit: 100 });
  const [joinChat, { isLoading: isJoiningChat }] = useJoinSupportChatMutation();

  const handleJoinChat = async (chatId?: string) => {
    if (!chatId) {
       toast.error("No active chat linked to this ticket");
       return;
    }
    try {
      await joinChat(chatId).unwrap();
      toast.success("Joined chat successfully! (Chat UI pending integration)");
      refetchAll();
      refetchMy();
    } catch (err) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || "Failed to join chat");
    }
  };

  const handleAssignToMe = async (_ticketId: string) => {
    // There isn't a dedicated "Assign" route exposed directly, but joining chat or resolving assigns it.
    // For now, we mock the assignment action with a UI toast to satisfy the mockup requirement until a dedicated backend assign endpoint exists.
    toast.info("Ticket assignment functionality is tied to the Chat UI. Click 'Join Chat' instead.");
  };

  const activeTicketsCount = statsData?.data?.stats?.total || 0;
  const resolvedTicketsCount = statsData?.data?.stats?.resolved || 0;
  
  const allTickets: SupportTicket[] = allTicketsData?.data?.tickets || [];
  const myTickets: SupportTicket[] = myTicketsData?.data?.tickets || [];

  const displayTickets = useMemo(() => {
    let baseData = activeTab === 'all' ? allTickets : myTickets;
    
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      baseData = baseData.filter((t) => 
        t?._id?.toLowerCase().includes(search) ||
        t?.tradeId?.tradeNumber?.toLowerCase().includes(search) ||
        t?.reason?.toLowerCase().includes(search)
      );
    }
    return baseData;
  }, [activeTab, allTickets, myTickets, searchTerm]);

  if (isLoadingStats || isLoadingAll || isLoadingMy) {
    return <LoadingSpinner text="Loading Support Center..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Support Center</h1>
          <p className="text-gray-600 mt-2">Manage customer support requests and active chats</p>
        </div>
        <div className="flex items-center gap-4">
           {/* Header action area */}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-indigo-50 to-white">
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                <p className="text-2xl font-bold text-gray-900">{activeTicketsCount}</p>
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-white">
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full text-green-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-gray-900">{resolvedTicketsCount}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-white">
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-full text-yellow-600">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{activeTicketsCount - resolvedTicketsCount}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-white">
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">My Queue</p>
                <p className="text-2xl font-bold text-gray-900">{myTickets.length}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Area */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <Tabs activeTab={activeTab} onTabChange={setActiveTab}>
              <div className="flex gap-2">
                <Tab id="all" label="All Tickets" icon={<MessageSquare className="w-4 h-4" />} />
                <Tab id="my" label="My Assigned Tickets" icon={<Headset className="w-4 h-4" />} />
              </div>
            </Tabs>
            
            <div className="relative min-w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search ticket ID or reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Ticket Details</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Trade Info</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Creation Date</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayTickets.map((ticket) => (
                  <tr key={ticket._id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 mt-1">
                          <Shield className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 max-w-[200px] truncate" title={ticket.reason}>
                            {ticket.reason || 'Support Request'}
                          </p>
                          <p className="text-sm font-mono text-gray-500">#{ticket._id.slice(-8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">
                         Trade #{ticket?.tradeId?.tradeNumber || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Buyer: {ticket?.tradeId?.buyerId?.name || 'Unknown'}<br/>
                        Seller: {ticket?.tradeId?.sellerId?.name || 'Unknown'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize
                        ${ticket.status === 'open' ? 'bg-red-100 text-red-800' : 
                          ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-green-100 text-green-800'}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(ticket.createdAt).toLocaleDateString()}<br/>
                      <span className="text-xs text-gray-400">
                        {new Date(ticket.createdAt).toLocaleTimeString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!ticket.assignedTo && activeTab === 'all' && ticket.status === 'open' ? (
                        <button
                          onClick={() => handleAssignToMe(ticket._id)}
                          className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition-colors"
                        >
                          Assign To Me
                        </button>
                      ) : (
                        <button
                          onClick={() => handleJoinChat(ticket.chatId)}
                          disabled={isJoiningChat}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                          Join Chat
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                
                {displayTickets.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <Headset className="w-12 h-12 mb-4 text-gray-300" />
                        <p className="text-lg font-medium text-gray-900">No support tickets found</p>
                        <p className="text-sm mt-1">You're all caught up!</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
};
