import React, { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { MessageSquare, Send, User, Check, CheckCheck, Clock, Info, AlertCircle, DollarSign, RotateCcw } from 'lucide-react';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url?: string;
  };
}

interface Order {
  id: string;
  buyer_id: string;
  seller_id: string;
  order_mode: 'direct' | 'negotiation';
  proposed_price: number | null;
  final_price: number | null;
  escrow_status: 'open' | 'cancelled' | 'released' | null;
  status: 'pending' | 'escrow_web2' | 'shipped' | 'completed' | 'disputed';
  amount_ada: number;
  buyer?: { full_name: string; avatar_url?: string };
  seller?: { full_name: string; avatar_url?: string };
}

const ChatBox = ({ orderId, order, onProposeNewPrice }: { orderId: string; order?: Order; onProposeNewPrice?: () => void }) => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const isNegotiation = order?.order_mode === 'negotiation';
  const isEscrowOpen = order?.escrow_status === 'open';
  const isOrderCompleted = order?.status === 'completed';
  
  // Déterminer qui est l'autre personne
  const otherPerson = user?.id === order?.buyer_id 
    ? order?.seller 
    : order?.buyer;
  const otherPersonName = otherPerson?.full_name || (language === 'fr' ? 'Vendeur' : 'Muuzaji');
  const isBuyer = user?.id === order?.buyer_id;

  const fetchMessages = useCallback(async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*, profiles:sender_id(full_name, avatar_url)')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      if (data.length !== messages.length) {
        setMessages(data);
      }
    }
  }, [orderId, messages.length]);

  useEffect(() => {
    fetchMessages();
    // Arrêter le polling si la commande est terminée
    if (isOrderCompleted) return;
    // Polling optimisé : 5 secondes au lieu de 2
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [orderId, isOrderCompleted, fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || isOrderCompleted || sending) return;

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage('');

    const { error } = await supabase
      .from('messages')
      .insert([{
        order_id: orderId,
        sender_id: user.id,
        content: messageContent
      }]);

    setSending(false);
    if (!error) {
      fetchMessages();
    } else {
      // Remettre le message en cas d'erreur
      setNewMessage(messageContent);
    }
  };

  // Formater la date de manière simple
  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return language === 'fr' ? 'À l\'instant' : 'Hivi sasa';
    if (diffMins < 60) return `${diffMins}${language === 'fr' ? ' min' : ' dak'}`;
    if (diffHours < 24) return `${diffHours}${language === 'fr' ? 'h' : ' saa'}`;
    if (diffDays === 1) return language === 'fr' ? 'Hier' : 'Jana';
    if (diffDays < 7) return `${diffDays}${language === 'fr' ? ' j' : ' siku'}`;
    return date.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'sw-TZ', { 
      day: 'numeric', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col h-[600px] border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
      {/* En-tête du chat - Style WhatsApp */}
      <div className="bg-gradient-to-r from-primary to-blue-600 p-4 border-b border-primary/20">
        <div className="flex items-center gap-3">
          {/* Avatar de l'autre personne */}
          <div className="relative">
            {otherPerson?.avatar_url ? (
              <img 
                src={otherPerson.avatar_url} 
                alt={otherPersonName}
                className="w-12 h-12 rounded-full object-cover border-2 border-white/50"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/50">
                <User className="w-6 h-6 text-white" />
              </div>
            )}
            {!isOrderCompleted && (
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-white text-lg truncate">{otherPersonName}</h3>
            {!isOrderCompleted && (
              <p className="text-xs text-blue-100 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></span>
                {language === 'fr' ? 'En ligne' : 'Hai mtandaoni'}
              </p>
            )}
          </div>
        </div>

        {/* Messages d'information contextuels */}
        {isOrderCompleted && (
          <div className="mt-3 p-2.5 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
            <p className="text-xs text-white font-medium flex items-center gap-2">
              <Info className="w-4 h-4" />
              {language === 'fr' 
                ? 'Cette conversation est terminée. Vous pouvez consulter l\'historique ci-dessous.' 
                : 'Mazungumzo haya yameisha. Unaweza kuangalia historia hapa chini.'}
            </p>
          </div>
        )}
        
        {!isOrderCompleted && isNegotiation && order?.escrow_status === 'cancelled' && isBuyer && onProposeNewPrice && (
          <div className="mt-3 p-3 bg-red-500/90 backdrop-blur-sm rounded-lg border border-white/30">
            <p className="text-xs text-white mb-2 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4" />
              {language === 'fr' 
                ? 'Proposition refusée - Vous pouvez en proposer une nouvelle' 
                : 'Pendekezo limekataliwa - Unaweza kupendekeza jipya'}
            </p>
            <button
              onClick={onProposeNewPrice}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition text-sm font-semibold backdrop-blur-sm border border-white/30"
            >
              <RotateCcw className="w-4 h-4" />
              {language === 'fr' ? 'Envoyer une nouvelle proposition' : 'Tuma pendekezo jipya'}
            </button>
          </div>
        )}
        
        {!isOrderCompleted && isNegotiation && isEscrowOpen && (
          <div className="mt-3 p-2.5 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
            <p className="text-xs text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              {language === 'fr' 
                ? `Négociation en cours - Prix proposé: ${order?.proposed_price} ADA` 
                : `Mazungumzo yanaendelea - Bei iliyopendekezwa: ${order?.proposed_price} ADA`}
            </p>
          </div>
        )}

        {!isOrderCompleted && messages.length === 0 && (
          <div className="mt-3 p-2.5 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
            <p className="text-xs text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              {language === 'fr' 
                ? '💬 Commencez la conversation ! Écrivez votre message ci-dessous.' 
                : '💬 Anza mazungumzo! Andika ujumbe wako hapa chini.'}
            </p>
          </div>
        )}
      </div>
      
      {/* Zone de messages - Style WhatsApp */}
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <MessageSquare className="w-10 h-10 text-primary" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium mb-1">
              {language === 'fr' ? 'Aucun message pour le moment' : 'Hakuna ujumbe kwa sasa'}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {language === 'fr' 
                ? 'Soyez le premier à envoyer un message !' 
                : 'Kuwa wa kwanza kutuma ujumbe!'}
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.sender_id === user?.id;
            const prevMsg = index > 0 ? messages[index - 1] : null;
            const showAvatar = !prevMsg || prevMsg.sender_id !== msg.sender_id;
            const showTime = !prevMsg || 
              new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() > 300000; // 5 minutes

            return (
              <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar (seulement si nouveau message de cette personne) */}
                {!isMe && showAvatar && (
                  <div className="flex-shrink-0">
                    {msg.profiles?.avatar_url ? (
                      <img 
                        src={msg.profiles.avatar_url} 
                        alt={msg.profiles.full_name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                    )}
                  </div>
                )}
                {isMe && !showAvatar && <div className="w-8"></div>}

                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                  {/* Nom (seulement si nouveau message) */}
                  {!isMe && showAvatar && (
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 px-1">
                      {msg.profiles?.full_name || otherPersonName}
                    </p>
                  )}
                  
                  {/* Bulle de message */}
                  <div className={`relative px-4 py-2.5 rounded-2xl shadow-sm ${
                    isMe 
                      ? 'bg-primary text-white rounded-br-md' 
                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md border border-gray-200 dark:border-gray-700'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {msg.content}
                    </p>
                    
                    {/* Timestamp et statut */}
                    <div className={`flex items-center gap-1 mt-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <span className={`text-[10px] ${
                        isMe ? 'text-blue-100' : 'text-gray-400 dark:text-gray-500'
                      }`}>
                        {formatMessageTime(msg.created_at)}
                      </span>
                      {isMe && (
                        <CheckCheck className="w-3 h-3 text-blue-100" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Zone de saisie - Style WhatsApp amélioré */}
      {isOrderCompleted ? (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <AlertCircle className="w-4 h-4" />
            <span>
              {language === 'fr' 
                ? 'Cette conversation est fermée. Vous ne pouvez plus envoyer de messages.' 
                : 'Mazungumzo haya yamefungwa. Hunaweza kutuma ujumbe tena.'}
            </span>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSend} className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={language === 'fr' ? 'Tapez votre message...' : 'Andika ujumbe wako...'}
                className="w-full p-3 pr-12 border-2 border-gray-200 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm"
                disabled={sending}
              />
              {sending && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <Clock className="w-4 h-4 text-gray-400 animate-spin" />
                </div>
              )}
            </div>
            <button 
              type="submit" 
              disabled={!newMessage.trim() || sending}
              className="flex-shrink-0 w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-medium hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              title={language === 'fr' ? 'Envoyer' : 'Tuma'}
            >
              {sending ? (
                <Clock className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          
          {/* Indicateur de frappe (peut être ajouté plus tard) */}
          {newMessage.trim() && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 px-3 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 flex-shrink-0" />
              {language === 'fr' 
                ? 'Astuce: Appuyez sur Entrée pour envoyer rapidement' 
                : 'Kidokezo: Bofya Enter ili kutuma haraka'}
            </p>
          )}
        </form>
      )}
    </div>
  );
};

export default ChatBox;
