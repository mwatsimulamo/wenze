import React, { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { MessageSquare, Send, User, Check, CheckCheck, Clock, Info, AlertCircle } from 'lucide-react';

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

const ChatBox = ({ orderId, order }: { orderId: string; order?: Order }) => {
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

  // Note: All negotiation actions are now handled in OrderDetail.tsx via Supabase

  return (
    <div className="flex flex-col h-[500px] border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 shadow-sm">
      <div className="bg-gray-50 dark:bg-gray-900 p-4 border-b border-gray-100 dark:border-gray-700 rounded-t-xl">
        <h3 className="font-bold text-gray-700 dark:text-gray-200">{t('chat.title')}</h3>
        {isOrderCompleted && (
          <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-xs text-amber-700 dark:text-amber-300 font-medium flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Cette conversation est fermée. Vous pouvez uniquement consulter l'historique.
            </p>
          </div>
        )}
        {!isOrderCompleted && isNegotiation && isEscrowOpen && (
          <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              {t('chat.negotiation.active')} <strong>{order?.proposed_price} ADA</strong>
            </p>
          </div>
        )}
      </div>
      
      {/* Note: Tous les boutons de négociation ont été déplacés vers OrderDetail.tsx pour une meilleure UX */}
      {/* La négociation se fait maintenant directement depuis la page de détail de la commande */}
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isMe = msg.sender_id === user?.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] p-3 rounded-lg text-sm ${
                isMe ? 'bg-primary text-white rounded-br-none' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'
              }`}>
                {!isMe && <p className="text-xs font-bold mb-1 opacity-70">{msg.profiles?.full_name}</p>}
                <p>{msg.content}</p>
                <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-gray-400 dark:text-gray-500'}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {isOrderCompleted ? (
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
            💬 Chat fermé - Mode historique uniquement
          </p>
        </div>
      ) : (
        <form onSubmit={handleSend} className="p-3 border-t border-gray-100 dark:border-gray-700 flex gap-2 bg-white dark:bg-gray-800">
          <input 
            type="text" 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={t('chat.placeholder')}
            className="flex-1 p-2 border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
          <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700">
            {t('chat.send')}
          </button>
        </form>
      )}
    </div>
  );
};

export default ChatBox;
