// src/pages/ChatPage.tsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  MoreVertical,
  Send,
  Paperclip,
  BadgeIndianRupee,
} from "lucide-react";
import axios from "axios"; // For S3 uploads
import { useAppSelector } from "../app/hooks";
import socketService from "../services/socket.service";
import type {
  ChatMessage as ChatMessageType,
  TradeStatus,
  BuyerRequest,
  SellerApproval,
  PaymentDetails,
  PaymentConfirmation,
} from "../types/chat.types";
import BuyerRequestFormComponent from "../components/Chat/BuyerRequestForm";
import BuyerMultiStepForm from "../components/Chat/BuyerMultiStepForm";
import SellerApprovalFormComponent from "../components/Chat/SellerApprovalForm";
import SellerMultiStepForm from "../components/Chat/SellerMultiStepForm";
import PaymentFormComponent from "../components/Chat/PaymentForm";
import PaymentConfirmationFormComponent from "../components/Chat/PaymentConfirmationForm";
import BuyerRatingInlineForm from "../components/Chat/InlineForms/BuyerRatingInlineForm";
import AppealInlineForm from "../components/Chat/InlineForms/AppealInlineForm";
// Inline forms (chat-style)
import BuyerInlineForm from "../components/Chat/InlineForms/BuyerInlineForm";
import SellerDepositInlineForm from "../components/Chat/InlineForms/SellerDepositInlineForm";
import BuyerPaymentInlineForm from "../components/Chat/InlineForms/BuyerPaymentInlineForm";
import SellerConfirmInlineForm from "../components/Chat/InlineForms/SellerConfirmInlineForm";
import CountdownTimer from "../components/Chat/CountdownTimer";
import api from "../api/axios";
import SummaryApi from "../api/SummaryApi";

type UIMessage =
  | (ChatMessageType & { tempId?: string; failed?: boolean })
  | any;

export default function ChatPage() {
  const navigate = useNavigate();
  const { tradeId, listingId } = useParams<{
    tradeId?: string;
    listingId?: string;
  }>();
  const auth = useAppSelector((s) => s.auth);
  const user = auth.user as any;
  const authReady = auth.checked && !auth.loading;

  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [message, setMessage] = useState("");
  const [showTradeInfo, setShowTradeInfo] = useState(false);
  const [showBuyerForm, setShowBuyerForm] = useState(false);
  const [showSellerForm, setShowSellerForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showConfirmationForm, setShowConfirmationForm] = useState(false);
  const [showAppealForm, setShowAppealForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // Toggle to use new multi-step forms (set to true to enable new forms)
  const [useMultiStepForms] = useState(true);

  // Toggle for inline forms (chat-style like the video) - set to true for inline
  const [useInlineForms] = useState(true);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [tradeStatus, setTradeStatus] = useState<TradeStatus>("initiated");
  const [buyerRequestData, setBuyerRequestData] = useState<BuyerRequest | null>(
    null
  );
  //const [sellerApprovalData, setSellerApprovalData] = useState<SellerApproval | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentDetails | null>(null);
  const [expiryTime, setExpiryTime] = useState<Date | null>(null);
  const [listingDetails, setListingDetails] = useState<any>(null);
  const [tradeData, setTradeData] = useState<any>(null);

  // const [chatCreatedBy, setChatCreatedBy] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isDirectChat, setIsDirectChat] = useState(false);
  const [userRole, setUserRole] = useState<"buyer" | "seller">("buyer");
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const scrollToBottom = useCallback(() => {
    setTimeout(
      () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
      50
    );
  }, []);

  const normalizeIncoming = (raw: any): UIMessage => {
    console.log("Normalizing incoming message:", raw);
    const id = raw.messageId ?? raw._id ?? raw.id ?? raw.id_str;
    const content = raw.content ?? raw.text ?? raw.message ?? raw.body;
    const type =
      raw.messageType ??
      raw.type ??
      raw.typeName ??
      (raw.system ? "system" : "text");
    const timestamp =
      raw.timestamp ??
      raw.createdAt ??
      raw.created_at ??
      new Date().toISOString();
    const senderId =
      raw.senderId?._id ??
      raw.senderId ??
      raw.from ??
      raw.userId ??
      raw.sender ??
      raw.createdBy;
    const senderRole =
      raw.senderRole ?? raw.role ?? raw.userRole ?? raw.participantRole;

    const actionType =
      raw.actionType ?? raw?.metadata?.actionType ?? raw.data?.actionType;

    return {
      id,
      _id: id,
      chatId: raw.chatId ?? raw.chat ?? raw.roomId,
      tradeId: raw.tradeId,
      content,
      text: content,
      type,
      timestamp,
      senderId,
      senderRole,
      actionType,
      __raw: raw,
    };
  };

  useEffect(() => {
    const initChat = async () => {
      if (!authReady) {
        setLoading(false);
        return;
      }
      if (!user) {
        setLoading(false);
        navigate("/login");
        return;
      }

      // NEW TRADE FLOW (buyer starts from listing)
      if (listingId && !tradeId) {
        try {
          setLoading(true);

          const chatConfig = SummaryApi.openChatWithListing(listingId);
          const chatRes = await api({
            url: chatConfig.url,
            method: chatConfig.method,
          });
          const chatDataRaw =
            chatRes.data?.data?.chat ||
            chatRes.data?.chat ||
            chatRes.data ||
            chatRes;

          const chatData =
            Array.isArray(chatDataRaw) && chatDataRaw.length > 0
              ? chatDataRaw[0]
              : chatDataRaw;

          if (chatData?._id || chatData?.id) {
            const chatIdRaw = chatData._id || chatData.id;
            const newChatId =
              typeof chatIdRaw === "string" ? chatIdRaw : String(chatIdRaw);
            setChatId(newChatId);

            // setChatCreatedBy(chatData.createdBy ?? null);

            socketService.joinChat(newChatId);

            try {
              const msgsConfig = SummaryApi.getMessages(newChatId);
              const msgsRes = await api({
                url: msgsConfig.url,
                method: msgsConfig.method,
              });
              const msgsPayload = msgsRes.data?.data || msgsRes.data || {};
              const rawMsgs = Array.isArray(msgsPayload)
                ? msgsPayload
                : msgsPayload.messages || [];
              const normalized = rawMsgs.map(normalizeIncoming);
              setMessages(normalized);
            } catch {
              console.log("No existing messages for new chat");
            }
          }

          const listingRes = await api.get(
            SummaryApi.getListingById(listingId).url
          );
          const payload = listingRes.data?.data || listingRes.data;
          const listing = payload?.listing || payload;
          if (listing) {
            setListingDetails(listing);
            setBuyerRequestData({
              usdtAmount: 0,
              inrAmount: 0,
              rate: listing.pricePerUnit || 0,
              paymentMode: [],
              agreeToShareDocuments: false, // Add this missing required property
              feeDetails: {
                currentRate: 0,
                cryptiansFee: 0,
                gasFee: 0,
                total: 0,
              },
            } as BuyerRequest);
          }

          setShowBuyerForm(true);
        } catch (err: any) {
          console.error("Failed to initialize chat:", err);
          const errorMsg =
            err?.response?.data?.message ||
            err?.message ||
            "Failed to start chat";
          alert(errorMsg);
        } finally {
          setLoading(false);
        }
        return;
      }

      // EXISTING TRADE FLOW
      if (!tradeId) {
        setLoading(false);
        return;
      }
      setShowBuyerForm(false); // Ensure form is hidden for existing trades

      try {
        setLoading(true);
        let chatRes: any = null;

        try {
          const chatConfig = SummaryApi.getChatByTradeId(tradeId);
          chatRes = await api({
            url: chatConfig.url,
            method: chatConfig.method,
          });
        } catch {
          chatRes = null;
        }

        if (!chatRes || !chatRes.data?.data) {
          try {
            const chatConfig2 = SummaryApi.getChatById(tradeId);
            chatRes = await api({
              url: chatConfig2.url,
              method: chatConfig2.method,
            });
          } catch {
            chatRes = null;
          }
        }

        if (!chatRes || !chatRes.data) {
          setLoading(false);
          return;
        }

        const chatPayload = chatRes.data?.data || chatRes.data || chatRes;
        console.log("Chat payload:", chatPayload);

        let chatData: any = null;
        if (Array.isArray(chatPayload) && chatPayload.length > 0) {
          chatData = chatPayload[0];
        } else if (Array.isArray(chatRes) && chatRes.length > 0) {
          chatData = chatRes[0];
        } else {
          chatData = chatPayload?.chat || chatPayload;
        }

        if (!chatData) {
          console.warn("No chat data found in response", chatRes);
          setLoading(false);
          return;
        }

        const idRaw = chatData._id || chatData.id || chatData.chatId;
        const id = typeof idRaw === "string" ? idRaw : String(idRaw);
        setChatId(id);

        // setChatCreatedBy(chatData.createdBy ?? null);

        const isDirect =
          chatData.type === "direct" ||
          !(chatData.tradeId || chatData.type === "trade");
        setIsDirectChat(Boolean(isDirect));

        const listing = chatData.listingId ?? chatData.listing ?? null;
        console.log("Listing details:", listing);
        if (listing) {
          setListingDetails(listing);
          if (!buyerRequestData) {
            setBuyerRequestData({
              usdtAmount: 0,
              inrAmount: 0,
              rate: listing.pricePerUnit || 0,
              paymentMode: [],
              agreeToShareDocuments: false, // Add this missing required property
              feeDetails: {
                currentRate: 0,
                cryptiansFee: 0,
                gasFee: 0,
                total: 0,
              },
            } as BuyerRequest);
          }
        }

        // Extract trade data from chat if available
        const trade = chatData.tradeId;
        console.log("========================================");
        console.log("Trade data from chat:", trade);
        console.log("Trade cryptoAmount:", trade?.cryptoAmount);
        console.log("Trade buyerWillReceive:", trade?.buyerWillReceive);
        console.log("Trade sellerMustSend:", trade?.sellerMustSend);
        console.log("Trade expiresAt:", trade?.expiresAt);
        console.log("Trade status:", trade?.status);
        console.log("========================================");
        if (trade && typeof trade === "object") {
          setTradeData(trade);

          // Set expiry time from trade if available
          if (trade.expiresAt) {
            const expiry = new Date(trade.expiresAt);
            console.log("Setting expiryTime from trade:", expiry);
            setExpiryTime(expiry);
          }

          // Set trade status from trade
          if (trade.status) {
            console.log("Setting tradeStatus from trade:", trade.status);
            setTradeStatus(trade.status as TradeStatus);
          }

          // Set buyer request data from trade - ALWAYS use cryptoAmount (original amount)
          const originalAmount =
            trade.cryptoAmount || trade.buyerWillReceive || 0;
          console.log(
            "Using original amount for buyer request:",
            originalAmount
          );
          setBuyerRequestData({
            usdtAmount: originalAmount,
            inrAmount: trade.totalINRAmount || 0,
            rate: trade.pricePerUnit || 0,
            paymentMode: trade.paymentMethod ? [trade.paymentMethod] : [],
            buyerWalletAddress: trade.buyerWalletAddress,
            feeDetails: {
              currentRate: trade.pricePerUnit || 0,
              cryptiansFee: trade.feeBreakdown?.platformFeeINR || 0,
              gasFee: trade.feeBreakdown?.gasFeeINR || 0,
              total: trade.totalINRAmount || 0,
            },
          } as BuyerRequest);
        }

        try {
          const currentUserId = user?._id || user?.id;
          const parts = Array.isArray(chatData.participants)
            ? chatData.participants
            : [];

          let inferredRole: "buyer" | "seller" = "buyer";

          if (currentUserId && parts.length > 0) {
            const me = parts.find((p: any) => {
              const uid =
                typeof p.userId === "string"
                  ? p.userId
                  : p.userId?._id || p.userId?.id;
              return uid && String(uid) === String(currentUserId);
            });

            if (me && (me.role === "buyer" || me.role === "seller")) {
              inferredRole = me.role;
            }
          }

          setUserRole(inferredRole);
          console.log(
            "ChatPage userRole:",
            inferredRole,
            "currentUserId:",
            currentUserId,
            "participants:",
            parts
          );
        } catch (err) {
          console.warn("Failed to infer user role from chat participants", err);
        }

        try {
          const joinConfig = SummaryApi.joinChat(id);
          await api({ url: joinConfig.url, method: joinConfig.method });
        } catch (err) {
          console.warn("Failed to join chat (may already be joined):", err);
        }

        try {
          const msgsConfig = SummaryApi.getMessages(id);
          const msgsRes = await api({
            url: msgsConfig.url,
            method: msgsConfig.method,
          });
          const msgsPayload = msgsRes.data?.data || msgsRes.data || {};
          const rawMsgs = Array.isArray(msgsPayload)
            ? msgsPayload
            : msgsPayload.messages || [];
          const normalized = rawMsgs.map(normalizeIncoming);
          setMessages(normalized);
        } catch (err) {
          console.warn("Failed to fetch messages:", err);
        }

        try {
          const readConfig = SummaryApi.markChatRead(id);
          await api({ url: readConfig.url, method: readConfig.method });
        } catch {
          /* ignore */
        }
      } catch (error) {
        console.error("Failed to load chat:", error);
      } finally {
        setLoading(false);
        scrollToBottom();
      }
    };

    initChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tradeId, listingId, authReady, user]);

  const upsertIncoming = useCallback(
    (incomingRaw: any) => {
      console.log("upsertIncoming called with:", incomingRaw);

      const incoming = normalizeIncoming(incomingRaw);

      // Update status when admin verifies deposit or instant seller confirms (socket path)
      if (
        incoming.actionType === "admin-verified-deposit" ||
        incoming.actionType === "escrow-confirmed"
      ) {
        console.log(">>> Escrow confirmed (socket event)");
        setTradeStatus("crypto-in-escrow");

        // Don't auto-open form - let buyer click button instead
        if (userRole === "buyer") {
          console.log(
            ">>> Buyer can now proceed to payment (button will appear)"
          );
          // setShowPaymentForm(true);  // ❌ Removed - buyer clicks button instead

          const expiry = new Date();
          expiry.setMinutes(expiry.getMinutes() + 15);
          setExpiryTime(expiry);
        }
      }

      // normal upsert handling
      setMessages((prev) => {
        if (incoming.id && prev.some((m) => (m.id ?? m._id) === incoming.id)) {
          return prev.map((m) =>
            (m.id ?? m._id) === incoming.id ? { ...m, ...incoming } : m
          );
        }

        if (incoming.id) {
          const optIdx = prev.findIndex(
            (m) =>
              m.tempId &&
              (m.content ?? m.text) === (incoming.content ?? incoming.text)
          );
          if (optIdx !== -1) {
            const copy = [...prev];
            copy[optIdx] = { ...incoming };
            return copy;
          }
        }

        return [...prev, incoming];
      });

      scrollToBottom();
    },
    [scrollToBottom, userRole]
  );

  useEffect(() => {
    if (!authReady || !user) return;

    const currentUserId = user?._id || user?.id;

    try {
      socketService.connect();
    } catch (err) {
      console.error("Socket connect failed:", err);
    }

    if (tradeId && !isDirectChat) {
      socketService.joinTrade(tradeId);
    }

    if (chatId && isDirectChat) {
      socketService.joinChat(chatId);
    }

    const messageHandler = (rawMsg: any) => {
      upsertIncoming(rawMsg);
    };
    socketService.onMessage(messageHandler);

    const tradeHandler = (data: any) => {
      console.log(">>> Trade status update received:", data);

      if (data?.status) setTradeStatus(data.status);

      // ✅ Server sends expiresAt, not expiryTime
      if (data?.expiresAt) {
        const expiry = new Date(data.expiresAt);
        console.log("Setting expiryTime from socket:", expiry);
        setExpiryTime(expiry);
      }

      // 🔥🔥  (BEFORE setTradeData)
      if (
        data?.status === "COMPLETED" ||
        data?.status === "CANCELLED" ||
        data?.status === "DISPUTED"
      ) {
        console.log(">>> Trade ended, clearing tradeData from chat");
        setTradeData(null);
        return; // ⛔ important: niche ka merge mat hone do
      }

      // Update full trade data (includes paymentProof for payment confirmation)
      if (data) {
        console.log(">>> Updating tradeData with:", data);
        setTradeData((prev: any) => ({ ...prev, ...data }));
      }
    };

    socketService.onTradeStatusUpdate(tradeHandler);

    // Handler for payment uploaded event
    const paymentUploadedHandler = (data: any) => {
      console.log(">>> Payment uploaded event received:", data);
      if (data?.status) setTradeStatus(data.status);
      // ✅ Server sends expiresAt, not expiryTime
      if (data?.expiresAt) setExpiryTime(new Date(data.expiresAt));

      if (data) {
        const updatedTrade = {
          ...data,
          buyerPaymentProof: {
            utrNumber: data.utrNumber,
            proofUrl: data.proofUrl,
            bank: data.bank,
            bankName: data.bankName,
            amountPaid: data.amount, // or data.amountPaid, depending on backend
            remarks: data.remarks,
          },
        };
        console.log(">>> Updating tradeData with payment proof:", updatedTrade);
        setTradeData((prev: any) => ({ ...prev, ...updatedTrade }));
      }
    };

    socketService.onPaymentUploaded(paymentUploadedHandler);

    // ✅ Listen to all timer-related events from server
    const s = socketService.getSocket();
    if (s && !isDirectChat) {
      // Generic handler for all order events that contain expiresAt
      const orderEventHandler = (data: any) => {
        console.log(">>> Order event received:", data);
        if (data?.status) setTradeStatus(data.status);
        if (data?.expiresAt) {
          const expiry = new Date(data.expiresAt);
          console.log("Setting expiryTime from order event:", expiry);
          setExpiryTime(expiry);
        }
        if (data) {
          setTradeData((prev: any) => ({ ...prev, ...data }));
        }
      };

      // Listen to all order lifecycle events
      s.on("order:created", orderEventHandler);
      s.on("order:deposit_required", orderEventHandler);
      s.on("order:escrow_confirmed", orderEventHandler);
      s.on("order:payment_confirmed", orderEventHandler);
      s.on("order:payment_timer", orderEventHandler);
      s.on("order:confirm_timer", orderEventHandler);
      s.on("order:completed", orderEventHandler);
      s.on("order:cancelled", orderEventHandler);
      s.on("order:disputed", orderEventHandler);
      s.on("order:appealed", orderEventHandler);
    }

    const typingHandler = (t: any) => {
      if (t.userId !== currentUserId) setIsTyping(Boolean(t.isTyping));
    };
    socketService.onTyping(typingHandler);

    if (s && isDirectChat) {
      s.on("chat:typing", (payload: any) => {
        if (!isDirectChat) return;
        if (payload?.userId === currentUserId) return;
        setIsTyping(Boolean(payload?.isTyping));
      });
    }
    // ✅ Listen to review submitted event
    const reviewSubmittedHandler = (data: any) => {
      console.log(">>> Review submitted event received:", data);
      if (data?.tradeId === tradeId) {
        setTradeData((prev: any) => ({
          ...prev,
          isReviewed: true,
          reviewedAt: data.reviewedAt || new Date().toISOString(),
        }));
        setHasRated(true);
      }
    };

    s?.on("trade:review-submitted", reviewSubmittedHandler);

    return () => {
      socketService.offMessage();
      socketService.offTradeStatusUpdate?.();
      socketService.offPaymentUploaded?.();
      socketService.offTyping?.();

      // Clean up order event listeners
      if (s && !isDirectChat) {
        s.off("order:created");
        s.off("order:deposit_required");
        s.off("order:escrow_confirmed");
        s.off("order:payment_timer");
        s.off("order:confirm_timer");
        s.off("order:completed");
        s.off("order:cancelled");
        s.off("order:disputed");
        s.off("order:appealed");
      }

      if (tradeId && !isDirectChat) socketService.leaveTrade(tradeId);
      if (chatId && isDirectChat) socketService.leaveChat(chatId);
      if (s && isDirectChat) s.off("chat:typing");
      if (s && !isDirectChat) {
        s.off("trade:review-submitted");
      }
    };
  }, [
    authReady,
    user,
    tradeId,
    chatId,
    isDirectChat,
    user?.id,
    user?._id,
    upsertIncoming,
  ]);

  useEffect(() => {
    scrollToBottom();
  }, [
    messages,
    showBuyerForm,
    showSellerForm,
    showPaymentForm,
    showConfirmationForm,
    showRatingForm,
    showAppealForm,
    scrollToBottom,
  ]);

  useEffect(() => {
    if (userRole !== "seller") return;
    if (paymentData) return;
    if (!tradeData?.buyerPaymentDetails) return; // ✅ Use correct property name

    console.log("Full trade data:", tradeData);
    console.log(
      ">>> Extracting payment data from trade:",
      tradeData.buyerPaymentDetails
    );

    const bp = tradeData.buyerPaymentDetails;

    const paymentDetails: PaymentDetails = {
      usdtAmount: tradeData.cryptoAmount || 0,
      inrAmount: tradeData.totalINRAmount || 0,
      rate: tradeData.pricePerUnit || 0,
      utrNumber: bp.transactionId || bp.utrNumber || "", // ✅ transactionId is correct field name
      screenshot: bp.proofUrl || "",
      amountPaid: bp.amount || bp.amountPaid || tradeData.totalINRAmount || 0, // ✅ amount is correct field name
      remarks: bp.remarks || "",
      bank: bp.bank || bp.bankName || "",
      bankName: bp.bankName || bp.bank || "",
    };

    console.log(">>> Setting payment data from trade:", paymentDetails);
    setPaymentData(paymentDetails);
  }, [tradeData, userRole, paymentData]);

  const sendTextMessage = async () => {
    if (!message.trim()) return;
    if (!chatId) return;

    const text = message.trim();
    setMessage("");

    const tempId = `temp-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    const optimistic: UIMessage = {
      tempId,
      chatId,
      content: text,
      text,
      type: "text",
      timestamp: new Date().toISOString(),
      senderId: user?.id ?? user?._id ?? "me",
      senderRole: userRole,
    };

    setMessages((prev) => [...prev, optimistic]);
    scrollToBottom();

    try {
      const sendConfig = SummaryApi.sendMessage(chatId);
      const res = await api({
        url: sendConfig.url,
        method: sendConfig.method,
        data: {
          content: text,
          messageType: "text",
        },
      });

      const saved = res.data?.data?.message || res.data?.message || res.data;
      if (saved) {
        const savedNormalized = normalizeIncoming(saved);

        setMessages((prev) =>
          prev.map((m) => (m.tempId === tempId ? savedNormalized : m))
        );
      }

      try {
        const readConfig = SummaryApi.markChatRead(chatId);
        await api({ url: readConfig.url, method: readConfig.method });
      } catch {
        /* ignore */
      }
    } catch (err: any) {
      console.error("Failed to send message:", err);

      setMessages((prev) =>
        prev.map((m) => (m.tempId === tempId ? { ...m, failed: true } : m))
      );

      setMessage(text);

      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to send message";
      alert(errorMsg);
    }
  };

  const sendActionMessage = async (
    actionType: string,
    text: string,
    data?: any
  ) => {
    if (!chatId) return;

    const messageType = actionType === "system" ? "system" : "action";

    try {
      const sendConfig = SummaryApi.sendMessage(chatId);
      await api({
        url: sendConfig.url,
        method: sendConfig.method,
        data: {
          content: text,
          messageType,
          actionType,
          data,
        },
      });
    } catch (error) {
      console.error(`Failed to send ${actionType} message:`, error);
    }
  };

  const handleBuyerRequest = async (data: BuyerRequest) => {
    console.log(
      "handleBuyerRequest called with full data:",
      JSON.stringify(data, null, 2)
    );
    console.log("metadata:", data.metadata);
    console.log("metadata.documents:", data.metadata?.documents);

    // ✅ Aadhaar URLs ko nikaal lo (child se aaye hue)
    const aadhaarFrontUrl =
      (data as any).aadhaarFrontUrl ||
      (data.metadata?.documents as any)?.aadhaarFrontUrl;
    const aadhaarBackUrl =
      (data as any).aadhaarBackUrl ||
      (data.metadata?.documents as any)?.aadhaarBackUrl;

    if (data.agreeToShareDocuments && (!aadhaarFrontUrl || !aadhaarBackUrl)) {
      console.error("Aadhaar URLs missing in BuyerRequest:", {
        aadhaarFrontUrl,
        aadhaarBackUrl,
        metadata: data.metadata,
      });
      alert("Aadhaar front and back URLs are missing in request payload");
      return;
    }

    // NEW TRADE FLOW: listingId present, no tradeId yet
    if (data.listingId) {
      try {
        if (!chatId) {
          alert("Chat must be created first. Please refresh the page.");
          return;
        }

        setLoading(true);

        console.log("Creating trade with:", {
          chatId,
          listingId: data.listingId,
          cryptoAmount: data.usdtAmount,
          buyerWalletAddress: data.buyerWalletAddress,
          paymentMode: data.paymentMode,
          isShareDocument: data?.agreeToShareDocuments,
          aadhaarFrontUrl,
          aadhaarBackUrl,
        });

        // Extract payment method from the array
        let paymentMethod: string | undefined = undefined;
        if (
          data.paymentMode &&
          Array.isArray(data.paymentMode) &&
          data.paymentMode.length > 0
        ) {
          paymentMethod = data.paymentMode[0];
          console.log("Extracted payment method:", paymentMethod);
        } else {
          console.warn(
            "No payment method found in data.paymentMode:",
            data.paymentMode
          );
        }

        // 🚨 YAHI JAGA PE backend ko EXACT fields bhejne hain
        const res = await api.post(SummaryApi.createTrade.url, {
          chatId,
          listingId: data.listingId,
          cryptoAmount: data.usdtAmount,
          buyerWalletAddress: data.buyerWalletAddress,
          paymentMethod: paymentMethod,
          networkName: data.networkName,
          cryptoType: data.cryptoType,
          metadata: data.metadata || {},

          // 🔥 Backend spec
          isShareDocument: true, // force true – backend “must be true”
          aadhaarFrontUrl, // required
          aadhaarBackUrl, // required
        });

        console.log("Create trade API response:", res.data);

        const newTrade = res.data?.data?.trade || res.data?.trade || res.data;
        if (newTrade?._id || newTrade?.id) {
          const newTradeId = newTrade._id || newTrade.id;

          const expiry = new Date();
          expiry.setMinutes(expiry.getMinutes() + 30);
          setExpiryTime(expiry);
          setBuyerRequestData(data);
          setTradeStatus("buyer-requested");

          console.log(
            "Trade created successfully, navigating to:",
            `/chat/${newTradeId}`
          );
          setShowBuyerForm(false);
          navigate(`/chat/${newTradeId}`, { replace: true });
        } else {
          console.error("No trade ID in response:", res.data);
          alert(
            "Trade created but no trade ID returned. Please contact support."
          );
          setLoading(false);
        }
      } catch (error: any) {
        console.error("Failed to create trade:", error);
        const serverMessage =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to start trade. Please try again.";
        alert(serverMessage);
        setLoading(false);
      }
      return;
    }

    // EXISTING TRADE FLOW (yahan kuch change nahi)
    if (!tradeId) return;

    setBuyerRequestData(data);
    sendActionMessage(
      "buyer-request",
      `Buyer requested ${data.usdtAmount} USDT for ₹${data.inrAmount.toFixed(
        2
      )}`,
      data
    );
    setTradeStatus("buyer-requested");
    setShowBuyerForm(false);
    setShowTradeInfo(false);
  };

  const handleSellerApproval = (data: SellerApproval) => {
    if (!tradeId) return;

    // No need to store this data since we never read it
    sendActionMessage(
      "seller-approval",
      `Seller approved! ${data.usdtToEscrow} USDT deposited to escrow`,
      data
    );
    setTradeStatus("crypto-in-escrow");
    setShowSellerForm(false);
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 30);
    setExpiryTime(expiry);
  };

  const handleSellerReject = () => {
    if (!tradeId) return;
    sendActionMessage("system", "Seller rejected the request");
    setTradeStatus("cancelled");
    setShowSellerForm(false);
  };

  // Helper function to format date for separators
  const formatDateSeparator = (date: Date): string => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
  };

  // Helper to check if we need a date separator
  const shouldShowDateSeparator = (
    currentMsg: UIMessage,
    prevMsg: UIMessage | null
  ): boolean => {
    if (!prevMsg) return true;
    const currentDate = new Date(
      currentMsg.timestamp ?? currentMsg.createdAt ?? Date.now()
    );
    const prevDate = new Date(
      prevMsg.timestamp ?? prevMsg.createdAt ?? Date.now()
    );
    return currentDate.toDateString() !== prevDate.toDateString();
  };

  // Helper function to get presigned URL from backend
  const getPaymentPresignedUrl = async (
    fileName: string,
    fileType: string,
    tradeIdParam: string
  ): Promise<{
    uploadUrl: string;
    fields: Record<string, string>;
    fileUrl: string;
    method?: string;
  }> => {
    try {
      const res = await api.post("/api/v1/upload/payment/presigned-url", {
        fileName,
        fileType,
        tradeId: tradeIdParam,
      });
      return res.data.data;
    } catch (err: any) {
      throw new Error(
        err?.response?.data?.message ?? "Failed to get upload URL"
      );
    }
  };

  // Helper function to upload to S3 using presigned URL
  const uploadToS3 = async (
    uploadUrl: string,
    fields: Record<string, string>,
    file: File,
    method: string = "POST"
  ): Promise<void> => {
    try {
      console.log(`Uploading to Storage via ${method}...`);

      if (method === "PUT") {
        // R2 Direct Upload (PUT)
        // For presigned PUT, we send the file directly in the body
        await axios.put(uploadUrl, file, {
          headers: {
            "Content-Type": file.type
          },
        });
      } else {
        // AWS S3 Form Upload (POST)
        const formData = new FormData();

        // Add all fields from presigned POST
        Object.entries(fields).forEach(([key, value]) => {
          formData.append(key, value);
        });

        // File must be added LAST
        formData.append("file", file);

        await axios.post(uploadUrl, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
    } catch (error) {
      console.error("Storage upload failed:", error);
      throw new Error("Failed to upload to Storage");
    }
  };

  const handlePaymentSubmit = async (data: PaymentDetails) => {
    if (!tradeId) {
      console.error("❌ No tradeId found");
      return;
    }

    let s3Url: string | null = null;
    console.log(data);
    try {
      console.log("📤 Getting presigned URL for payment proof");

      // Convert screenshot to File
      let file: File | null = null;
      if (data.screenshot) {
        const response = await fetch(data.screenshot);
        const blob = await response.blob();
        file = new File([blob], `payment-proof-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
      }

      if (!file) {
        throw new Error("No screenshot file to upload");
      }

      // Get presigned URL
      const { uploadUrl, fields, fileUrl, method } = await getPaymentPresignedUrl(
        file.name,
        file.type,
        tradeId
      );

      console.log("✅ Got presigned URL, uploading to S3/R2...");

      // Upload to S3/R2
      await uploadToS3(uploadUrl, fields, file, method);

      console.log("✅ File uploaded to Storage:", fileUrl);
      s3Url = fileUrl;
    } catch (error: any) {
      console.error("❌ Error uploading to Storage:", error.message);
      // Continue with data URL if S3/R2 fails
    }

    try {
      // Call backend API to save payment details
      console.log("📤 Calling backend to save payment details...");

      const cfg = SummaryApi.uploadPaymentProof(tradeId);
      await api.post(cfg.url, {
        transactionId: data.transactionId,
        amount: data.amount,
        bank: data.bank,
        proofUrl: s3Url || data.proofUrl,
      });

      console.log("✅ Payment details saved to backend");
    } catch (error: any) {
      console.error(
        "❌ Error saving payment to backend:",
        error.response?.data?.message || error.message
      );
      // Continue anyway - show the form
    }

    // Update payment data with S3 URL if available
    const paymentDataWithUrl = {
      ...data,
      screenshot: s3Url || data.screenshot,
    };

    setPaymentData(paymentDataWithUrl);
    sendActionMessage(
      "payment-request",
      `Payment submitted. UTR: ${data.utrNumber}`,
      paymentDataWithUrl
    );
    setTradeStatus("payment-submitted");
    setShowPaymentForm(false);
  };

  const handlePaymentConfirm = (data: PaymentConfirmation) => {
    if (!tradeId) return;
    sendActionMessage(
      "crypto-release",
      `✅ Payment confirmed! Crypto released to buyer`,
      data
    );
    setTradeStatus("completed");
    setShowConfirmationForm(false);
    // ✅ Show rating form after completion (if buyer)
    if (userRole === "buyer") {
      setTimeout(() => {
        setShowRatingForm(true);
      }, 1000); // 2 second delay
    }
  };
  const handlePaymentReject = (reason: string) => {
    if (!tradeId) return;
    sendActionMessage("system", `❌ Payment issue reported: ${reason}`);
    setTradeStatus("disputed");
    setShowConfirmationForm(false);
  };
  const handleCancelTrade = async () => {
    if (!tradeId || cancelling) return;

    const confirm = window.confirm(
      "Are you sure you want to cancel this trade? This action cannot be undone."
    );
    if (!confirm) return;

    try {
      setCancelling(true);
      const cancelChat = SummaryApi.cancelTrade(tradeId);
      await api({
        url: cancelChat.url,
        method: cancelChat.method,
        data: {
          reason: "Cancelled by user from chat",
        },
      });

      // UI update (socket bhi aayega, but safe side)
      setTradeStatus("cancelled");
      setTradeData(null);

      sendActionMessage("system", "❌ Trade cancelled by user");
    } catch (err: any) {
      alert(
        err?.response?.data?.message || err?.message || "Failed to cancel trade"
      );
    } finally {
      setCancelling(false);
      setShowHeaderMenu(false);
    }
  };

  const handleProceedToPayment = () => {
    setShowPaymentForm(true);
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 15);
    setExpiryTime(expiry);
  };

  const getStatusMessage = () => {
    switch (tradeStatus) {
      case "initiated":
        return "Trade initiated";
      case "buyer-requested":
        return userRole === "buyer"
          ? "Waiting for seller approval..."
          : "Buyer has submitted a request";
      case "crypto-in-escrow":
        return userRole === "seller"
          ? "Crypto in escrow. Waiting for buyer payment..."
          : "Good news! Seller is ready to proceed";
      case "payment-submitted":
        return userRole === "buyer"
          ? "Payment submitted. Waiting for seller confirmation..."
          : "Buyer has submitted payment. Please verify";
      case "completed":
        return "✅ Trade completed successfully!";
      case "cancelled":
        return "❌ Trade cancelled";
      case "disputed":
        return "⚠️ Trade disputed. Contact support";
      default:
        return "";
    }
  };
  // Update the useEffect to check if already rated
  useEffect(() => {
    if (
      // Show rating form after 2 seconds
      userRole === "buyer" &&
      tradeStatus === "completed" &&
      !showRatingForm &&
      !hasRated &&
      tradeData
    ) {
      // Check if trade already has been reviewed
      if (tradeData.buyerReviewed) {
        console.log("Trade already reviewed, skipping rating form");
        setHasRated(true);
        return;
      }
      // Show rating form after 2 seconds
      const timer = setTimeout(() => {
        console.log("Showing rating form after trade completion");
        setShowRatingForm(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [tradeStatus, userRole, showRatingForm, hasRated, tradeData]);

  if (loading || !authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  // Only buyer, trade initiated, listing present
  const showReadyButton =
    userRole === "buyer" &&
    (tradeStatus === "initiated" ||
      tradeStatus === "cancelled" ||
      tradeStatus === "disputed") &&
    (listingDetails || listingId);
  return (
    <div className="h-screen bg-gray-50 dark:bg-slate-950 flex flex-col overflow-hidden">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 dark:from-indigo-700 dark:to-indigo-800 text-white shadow-lg px-3 py-4 sm:px-5 flex items-center gap-3 sm:gap-4 sticky top-0 z-50 border-b border-indigo-500/30">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-white/20 active:bg-white/30 text-white transition-all"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="font-bold text-base sm:text-lg truncate">
            {listingId
              ? "New Trade Request"
              : isDirectChat
                ? `Chat`
                : `Trade #${tradeId?.substring(0, 8)}...`}
          </div>
          <div className="text-[11px] sm:text-xs opacity-90 truncate">
            {buyerRequestData && (
              <span>
                {buyerRequestData.usdtAmount} USDT ⇄ ₹
                {buyerRequestData.inrAmount?.toLocaleString()}
              </span>
            )}
            {!buyerRequestData && "Counterparty • Online"}
          </div>
        </div>

        {/* TIMER - Always visible when active */}
        <div className="flex items-center gap-2">
          {expiryTime &&
            tradeStatus !== "completed" &&
            tradeStatus !== "cancelled" && (
              <CountdownTimer
                expiryTime={expiryTime}
                onExpire={() => {
                  sendActionMessage(
                    "system",
                    "⏰ Time expired! Trade cancelled."
                  );
                  setTradeStatus("cancelled");
                }}
              />
            )}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowHeaderMenu((v) => !v)}
            className="p-2 rounded-lg hover:bg-white/20 active:bg-white/30 text-white transition-all"
            aria-label="Options menu"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {showHeaderMenu && tradeId && tradeStatus !== "completed" && (
            <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 z-50 overflow-hidden">
              <button
                disabled={cancelling}
                onClick={handleCancelTrade}
                className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
              >
                {cancelling ? "Cancelling..." : "Cancel Trade"}
              </button>
              {(tradeStatus === "disputed" || tradeStatus === "payment_proof_uploaded") && (
                <button
                  onClick={() => {
                    setShowAppealForm(true);
                    setShowHeaderMenu(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm font-medium text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-colors border-t border-gray-100 dark:border-slate-700"
                >
                  Appeal Trade
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* TRADE INFO */}
      {showTradeInfo && (
        <div className="bg-white shadow px-4 py-3 text-sm border-b">
          <div className="flex justify-between items-center">
            <div className="font-semibold text-gray-800">
              Status: {getStatusMessage()}
            </div>
            {expiryTime &&
              tradeStatus !== "completed" &&
              tradeStatus !== "cancelled" && (
                <CountdownTimer
                  expiryTime={expiryTime}
                  onExpire={() => {
                    console.log("Trade expired!");
                    setTradeStatus("cancelled");
                  }}
                  warningThreshold={5}
                />
              )}
          </div>

          {buyerRequestData && (
            <div className="mt-3 text-xs text-gray-600">
              <div>
                Amount: {buyerRequestData.usdtAmount} USDT = ₹
                {buyerRequestData.inrAmount.toFixed(2)}
              </div>
              <div>Rate: 1 USDT = ₹{buyerRequestData.rate}</div>
              {buyerRequestData.paymentMode &&
                buyerRequestData.paymentMode.length > 0 && (
                  <div>Payment Method: {buyerRequestData.paymentMode[0]}</div>
                )}
            </div>
          )}

          {userRole === "buyer" &&
            tradeStatus === "crypto-in-escrow" &&
            !isDirectChat && (
              <button
                onClick={handleProceedToPayment}
                className="mt-3 w-full bg-orange-600 text-white px-3 py-2 rounded text-sm font-semibold hover:bg-orange-700"
              >
                Proceed to Transfer
              </button>
            )}

          {userRole === "seller" &&
            tradeStatus === "buyer-requested" &&
            !showSellerForm &&
            !isDirectChat && (
              <button
                onClick={() => setShowSellerForm(true)}
                className="mt-3 w-full bg-green-600 text-white px-3 py-2 rounded text-sm font-semibold hover:bg-green-700"
              >
                Review Buyer Request
              </button>
            )}

          {userRole === "seller" &&
            tradeStatus === "payment-submitted" &&
            !showConfirmationForm &&
            !isDirectChat && (
              <button
                onClick={() => setShowConfirmationForm(true)}
                className="mt-3 w-full bg-purple-600 text-white px-3 py-2 rounded text-sm font-semibold hover:bg-purple-700"
              >
                Verify Payment & Release Crypto
              </button>
            )}

          {tradeStatus === "disputed" && !showAppealForm && (
            <button
              onClick={() => setShowAppealForm(true)}
              className="mt-3 w-full bg-orange-600 text-white px-3 py-2 rounded text-sm font-semibold hover:bg-orange-700"
            >
              Appeal this Dispute
            </button>
          )}
        </div>
      )}

      {/* ======================= CHAT BODY ======================= */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
        <div className="max-w-3xl mx-auto min-h-full flex flex-col">
          {/* 👇 PUSHES MESSAGES TO BOTTOM WHEN FEW */}
          <div className="flex-1" />

          {tradeStatus !== "initiated" && !isDirectChat && (
            <div
              className={`p-3.5 rounded-xl text-center text-sm font-semibold mb-4 shadow-sm ${tradeStatus === "completed"
                ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 text-green-800 dark:text-green-300 border border-green-300 dark:border-green-700"
                : tradeStatus === "disputed" || tradeStatus === "cancelled"
                  ? "bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-700"
                  : "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700"
                }`}
            >
              {getStatusMessage()}
              {tradeStatus === "cancelled" && userRole === "buyer" && (
                <button
                  onClick={() => setShowBuyerForm(true)}
                  className="block mt-2 mx-auto bg-white/20 hover:bg-white/30 text-red-900 dark:text-red-100 text-xs px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-700/50 transition-all font-bold"
                >
                  Start New Trade
                </button>
              )}
            </div>
          )}

          {messages.map((m, idx) => {
            const key = m.id ?? m._id ?? m.tempId ?? `idx-${idx}`;
            const prevMsg = idx > 0 ? messages[idx - 1] : null;
            const showDateSeparator = shouldShowDateSeparator(m, prevMsg);

            const isMine =
              (m.senderId &&
                (m.senderId === user?.id || m.senderId === user?._id)) ||
              m.senderId === "me";

            const content = m.content ?? m.text ?? "";

            const isSystemLike = m.type === "system" || m.type === "action";

            const isSellerDepositRequiredMessage =
              (m.actionType === "seller-deposit-required" ||
                m.actionType === "seller-confirmation-required") &&
              userRole === "seller" &&
              tradeStatus !== "completed" &&
              tradeStatus !== "cancelled";

            const isBuyerPaymentRequiredMessage =
              (m.actionType === "admin-verified-deposit" ||
                m.actionType === "escrow-confirmed") &&
              userRole === "buyer" &&
              tradeStatus !== "completed" &&
              tradeStatus !== "cancelled" &&
              !showPaymentForm;

            const isSellerConfirmationRequiredMessage =
              m.actionType === "payment-proof-uploaded" &&
              userRole === "seller" &&
              tradeStatus !== "completed" &&
              tradeStatus !== "cancelled" &&
              !showConfirmationForm;

            return (
              <React.Fragment key={key}>
                {showDateSeparator && (
                  <div className="flex justify-center my-4">
                    <div className="bg-slate-200 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300 text-[11px] font-medium px-4 py-1.5 rounded-full shadow-sm">
                      {formatDateSeparator(
                        new Date(m.timestamp ?? m.createdAt ?? Date.now())
                      )}
                    </div>
                  </div>
                )}

                {isSystemLike ? (
                  <div className="flex justify-center my-3">
                    <div className="bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/40 dark:to-yellow-900/40 text-amber-900 dark:text-amber-100 text-xs sm:text-sm px-5 py-3 rounded-xl shadow-md max-w-[90%] sm:max-w-[70%] text-center border border-amber-200 dark:border-amber-700/50">
                      <p className="leading-relaxed font-medium">{content}</p>

                      <span className="block mt-2 text-amber-700 dark:text-amber-400 text-[10px] font-medium opacity-80">
                        {new Date(
                          m.timestamp ?? m.createdAt ?? Date.now()
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>

                      {isSellerDepositRequiredMessage && (
                        <button
                          onClick={() => setShowSellerForm(true)}
                          className="mt-3 w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2.5 rounded-lg text-xs font-bold hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg active:scale-95"
                        >
                          Deposit Crypto / Approve Request
                        </button>
                      )}

                      {isBuyerPaymentRequiredMessage && (
                        <button
                          onClick={() => {
                            setShowPaymentForm(true);
                            if (!expiryTime) {
                              const expiry = new Date();
                              expiry.setMinutes(expiry.getMinutes() + 30);
                              setExpiryTime(expiry);
                            }
                          }}
                          className="mt-3 w-full bg-gradient-to-r from-orange-600 to-red-600 text-white px-4 py-2.5 rounded-lg text-xs font-bold hover:from-orange-700 hover:to-red-700 transition-all shadow-md hover:shadow-lg active:scale-95"
                        >
                          Proceed to Payment
                        </button>
                      )}

                      {isSellerConfirmationRequiredMessage && (
                        <button
                          onClick={() => setShowConfirmationForm(true)}
                          className="mt-3 w-full bg-gradient-to-r from-purple-600 to-violet-600 text-white px-4 py-2.5 rounded-lg text-xs font-bold hover:from-purple-700 hover:to-violet-700 transition-all shadow-md hover:shadow-lg active:scale-95"
                        >
                          Verify Payment & Release Crypto
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div
                    className={`flex mb-2 ${isMine ? "justify-end" : "justify-start"
                      }`}
                  >
                    <div className="flex flex-col max-w-[80%] sm:max-w-[70%]">
                      <div
                        className={`px-4 py-2.5 rounded-2xl shadow-sm ${isMine
                          ? "bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-br-md"
                          : "bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-bl-md"
                          }`}
                      >
                        <p className="text-[14px] leading-relaxed break-words whitespace-pre-wrap">
                          {content}
                        </p>
                        <span className={`block mt-1 text-[10px] ${isMine ? "text-indigo-100" : "text-gray-500 dark:text-slate-400"}`}>
                          {new Date(
                            m.timestamp ?? m.createdAt ?? Date.now()
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}

          {/* ==================== BUYER FORM - RIGHT SIDE ==================== */}
          {showBuyerForm && (
            <div className="flex justify-end my-2">
              <div className="max-w-md w-full">
                <div className="bg-indigo-600 text-white rounded-2xl rounded-br-sm shadow-sm p-4">
                  {useInlineForms ? (
                    <BuyerInlineForm
                      listingId={
                        listingId ||
                        listingDetails?._id ||
                        listingDetails?.id ||
                        ""
                      }
                      listingDetails={listingDetails}
                      onSubmit={handleBuyerRequest}
                    // isBuyer={true}
                    />
                  ) : useMultiStepForms ? (
                    <BuyerMultiStepForm
                      onComplete={handleBuyerRequest}
                      onCancel={() => setShowBuyerForm(false)}
                      listingId={
                        listingId || listingDetails?._id || listingDetails?.id
                      }
                      listingDetails={listingDetails}
                    // isBuyer={true}
                    />
                  ) : (
                    <BuyerRequestFormComponent
                      onSubmit={handleBuyerRequest}
                      onCancel={() => setShowBuyerForm(false)}
                      minLimit={listingDetails?.minTradeLimit}
                      maxLimit={listingDetails?.maxTradeLimit}
                      pricePerUnit={listingDetails?.pricePerUnit}
                      listingId={
                        listingId || listingDetails?._id || listingDetails?.id
                      }
                      chatId={chatId || undefined}
                    // isBuyer={true}
                    />
                  )}
                </div>
                <div className="text-right mt-1">
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">
                    {new Date().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </div>
          )}
          {showSellerForm && buyerRequestData && tradeId && (
            <>
              {useInlineForms ? (
                <SellerDepositInlineForm
                  tradeId={tradeData?._id || tradeData?.id || tradeId}
                  onApprove={handleSellerApproval}
                  onReject={handleSellerReject}
                />
              ) : useMultiStepForms ? (
                <SellerMultiStepForm
                  tradeId={tradeId}
                  buyerRequest={buyerRequestData}
                  onApprove={handleSellerApproval}
                  onReject={handleSellerReject}
                />
              ) : (
                <SellerApprovalFormComponent
                  tradeId={tradeId}
                  buyerRequest={buyerRequestData}
                  onApprove={handleSellerApproval}
                  onReject={handleSellerReject}
                />
              )}
            </>
          )}

          {/* Alternative: Keep component as-is but override styling */}
          {showPaymentForm && buyerRequestData && userRole === "buyer" && (
            <div className="flex justify-end my-2">
              {useInlineForms ? (
                <div className="max-w-md w-full">
                  <div className="bg-indigo-600 text-white rounded-2xl rounded-br-sm shadow-sm overflow-hidden">
                    {/* Override inner component's background */}
                    <div className="[&>div]:bg-transparent [&>div]:shadow-none [&>div]:border-0 [&>div]:rounded-none">
                      <BuyerPaymentInlineForm
                        tradeId={tradeId || ""}
                        timeLimit={30}
                        onSubmit={handlePaymentSubmit}
                        sellerPaymentDetails={{
                          upiId: undefined,
                          bankName: undefined,
                          accountNumber: undefined,
                          ifsc: undefined,
                          accountHolder: undefined,
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-right mt-1">
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                      {new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="max-w-md w-full">
                  <PaymentFormComponent
                    sellerBankDetails={{
                      bankName: "HDFC Bank",
                      accountNumber: "1234567890123456",
                      upiId: "seller@paytm",
                    }}
                    tradeDetails={{
                      usdtAmount: buyerRequestData.usdtAmount,
                      inrAmount: buyerRequestData.inrAmount,
                      rate: buyerRequestData.rate,
                    }}
                    onSubmit={handlePaymentSubmit}
                    onCancel={() => {
                      setShowPaymentForm(false);
                    }}
                  />
                </div>
              )}
            </div>
          )}
          {showConfirmationForm && paymentData && userRole === "seller" && (
            <>
              {useInlineForms ? (
                <SellerConfirmInlineForm
                  tradeId={tradeData?._id || tradeData?.id || tradeId || ""}
                  paymentData={paymentData} // pass FULL object, don't slice it
                  onConfirm={handlePaymentConfirm}
                  onReject={handlePaymentReject}
                />
              ) : (
                <PaymentConfirmationFormComponent
                  paymentDetails={paymentData}
                  onConfirm={handlePaymentConfirm}
                  onReject={handlePaymentReject}
                />
              )}
            </>
          )}
          {/* ==================== RATING FORM - RIGHT SIDE ==================== */}
          {showRatingForm &&
            userRole === "buyer" &&
            tradeStatus === "completed" && (
              <div className="flex justify-end my-2">
                <div className="max-w-md w-full">
                  <div className="bg-gradient-to-br from-purple-900 to-blue-900 text-white rounded-2xl rounded-br-sm shadow-lg p-4 border border-purple-500/30">
                    <BuyerRatingInlineForm
                      tradeId={tradeId || ""}
                      sellerName={tradeData?.sellerId?.name || "Seller"}
                      sellerId={
                        tradeData?.sellerId?._id || tradeData?.sellerId?.id
                      }
                      onSuccess={() => {
                        console.log("✅ Rating submitted successfully!");
                        setShowRatingForm(false);
                        setHasRated(true);

                        // Update local trade data
                        setTradeData((prev: any) => ({
                          ...prev,
                          buyerReviewed: true,
                        }));

                        // Send system message to chat
                        sendActionMessage(
                          "rating-submitted",
                          `⭐ Buyer rated the seller`,
                          {
                            tradeId,
                            timestamp: new Date().toISOString(),
                          }
                        );
                      }}
                      onCancel={() => {
                        console.log("❌ Rating cancelled/skipped by user");
                        setShowRatingForm(false);
                        setHasRated(true); // Don't show again
                      }}
                    />
                  </div>
                  <div className="text-right mt-1">
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                      {new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            )}
          {showAppealForm && tradeId && (
            <div className="flex justify-end my-2">
              <div className="max-w-md w-full">
                <AppealInlineForm
                  tradeId={tradeId}
                  onSuccess={(reason) => {
                    setShowAppealForm(false);
                    setTradeStatus("appealed");
                    sendActionMessage("appeal", `🚨 Trade appealed: ${reason}`, {
                      tradeId,
                      reason,
                      timestamp: new Date().toISOString(),
                    });
                  }}
                  onCancel={() => setShowAppealForm(false)}
                />
              </div>
            </div>
          )}

          {isTyping && (
            <div className="flex justify-start my-2 animate-pulse">
              <div className="bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 text-xs px-4 py-2 rounded-2xl rounded-bl-md border border-gray-200 dark:border-slate-700 italic shadow-sm">
                <span className="inline-flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  <span className="ml-1">Typing...</span>
                </span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>
      {/* ======================= INPUT BAR ======================= */}
      <div
        className="
    sticky bottom-0 left-0 right-0 z-40 shrink-0
    bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg
    border-t border-gray-200 dark:border-white/10
    shadow-2xl
  "
      >
        <div className="max-w-3xl mx-auto px-3 py-3 sm:py-3.5">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* ATTACH BUTTON */}
            <button
              className="
          p-2.5 sm:p-3 rounded-full
          bg-gray-100 hover:bg-gray-200 active:bg-gray-300
          dark:bg-white/10 dark:hover:bg-white/20 dark:active:bg-white/30
          transition-all duration-150
        "
              aria-label="Attach file"
            >
              <Paperclip className="w-5 h-5 text-gray-700 dark:text-white/70" />
            </button>

            {/* MESSAGE INPUT */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  if (tradeId) {
                    socketService.emitTyping(tradeId, e.target.value.length > 0);
                  }
                }}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  (e.preventDefault(), sendTextMessage())
                }
                placeholder="Type a message"
                className="
            w-full
            px-4 py-2.5 sm:py-3
            rounded-full
            bg-gray-100 dark:bg-white/10
            border border-gray-300 dark:border-white/20
            text-gray-900 dark:text-white text-sm sm:text-base
            placeholder-gray-500 dark:placeholder-white/50
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
            transition-all
          "
              />
            </div>

            {/* SEND BUTTON */}
            <button
              onClick={sendTextMessage}
              disabled={!message.trim()}
              className="
          p-2.5 sm:p-3 rounded-full
          bg-gradient-to-r from-indigo-600 to-indigo-700
          hover:from-indigo-700 hover:to-indigo-800
          disabled:opacity-40 disabled:cursor-not-allowed
          transition-all duration-150
          shadow-lg active:scale-95
        "
              aria-label="Send message"
            >
              <Send className="w-5 h-5 text-white" />
            </button>

            {/* READY TO TRANSFER / START NEW TRADE BUTTON */}
            {showReadyButton && (
              <button
                onClick={() => setShowBuyerForm(true)}
                aria-label={
                  tradeStatus === "cancelled" || tradeStatus === "disputed"
                    ? "Start New Trade"
                    : "Ready to Transfer"
                }
                className={`
                  flex items-center justify-center
                  ${tradeStatus === "cancelled" || tradeStatus === "disputed"
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 hover:shadow-blue-600/50"
                    : "bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-green-600/50"
                  }
                  text-white font-bold
                  rounded-full
                  transition-all
                  hover:shadow-xl
                  active:scale-95
                  px-4 py-3
                `}
              >
                {/* Mobile */}
                <BadgeIndianRupee className="w-5 h-5 sm:hidden" />

                {/* Desktop */}
                <span className="hidden sm:inline text-sm px-2">
                  {tradeStatus === "cancelled" || tradeStatus === "disputed"
                    ? "Start New Trade"
                    : "Ready to Transfer"}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
