import api from './axios';
import SummaryApi from './SummaryApi';

const ChatApi = {
  // Open or get a direct chat (POST /api/v1/platform-a/chat/open)
  openOrGetDirectChat: (payload: any) => api.post(SummaryApi.openOrGetDirectChat.url, payload),
  openChatWithListing: (listingId: string) => api.post(SummaryApi.openChatWithListing(listingId).url),
  // GET /api/v1/platform-a/chat
  getAllChats: (params?: any) => api.get(SummaryApi.getAllChats.url, { params }),

  // GET /api/v1/platform-a/chat/:id
  getChatById: (chatId: string) => api.get(SummaryApi.getChatById(chatId).url),

  // GET /api/v1/platform-a/chat/trade/:tradeId
  getChatByTradeId: (tradeId: string) => api.get(SummaryApi.getChatByTradeId(tradeId).url),

  // GET /api/v1/platform-a/chat/:id/messages
  getMessages: (chatId: string, params?: any) => api.get(SummaryApi.getMessages(chatId).url, { params }),

  // POST /api/v1/platform-a/chat/:id/messages
  sendMessage: (chatId: string, payload: any) => api.post(SummaryApi.sendMessage(chatId).url, payload),

  // POST /api/v1/platform-a/chat/:id/read
  markChatRead: (chatId: string) => api.post(SummaryApi.markChatRead(chatId).url),

  // GET /api/v1/platform-a/chat/unread/count
  unreadMessageCount: () => api.get(SummaryApi.unreadMessageCount.url),
};

export default ChatApi;
