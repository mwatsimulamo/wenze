import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Check, X, DollarSign, MessageSquare } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  profiles: {
    full_name: string;
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
  amount_ada: number;
}

const ChatBox = ({ orderId, order }: { orderId: string; order?: Order }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showPriceInput, setShowPriceInput] = useState(false);
  const [priceInput, setPriceInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const isBuyer = order && user?.id === order.buyer_id;
  const isSeller = order && user?.id === order.seller_id;
  const isNegotiation = order?.order_mode === 'negotiation';
  const isEscrowOpen = order?.escrow_status === 'open';

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval);
  }, [orderId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*, profiles:sender_id(full_name)')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      if (data.length !== messages.length) {
        setMessages(data);
      }
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const { error } = await supabase
      .from('messages')
      .insert([{
        order_id: orderId,
        sender_id: user.id,
        content: newMessage
      }]);

    if (!error) {
      setNewMessage('');
      fetchMessages();
    }
  };

  const callAPI = async (endpoint: string, body?: any) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || ''
        },
        body: body ? JSON.stringify(body) : undefined
      });

      const data = await response.json();
      if (data.success) {
        fetchMessages();
        // Rafraîchir l'ordre (à gérer par le parent)
        window.location.reload(); // Simple pour MVP
      } else {
        alert(data.error || 'Erreur');
      }
    } catch (error) {
      alert('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleProposePrice = async () => {
    const price = parseFloat(priceInput);
    if (isNaN(price) || price <= 0) {
      alert('Prix invalide');
      return;
    }
    await callAPI('/propose-price', { proposed_price: price });
    setShowPriceInput(false);
    setPriceInput('');
  };

  const handleAcceptPrice = () => {
    const msg = t('chat.negotiation.accept') === 'Accepter' 
      ? 'Accepter ce prix et continuer la transaction ?'
      : 'Kubali bei hii na kuendelea na biashara?';
    if (confirm(msg)) {
      callAPI('/accept-price');
    }
  };

  const handleCounterOffer = async () => {
    const price = parseFloat(priceInput);
    if (isNaN(price) || price <= 0) {
      alert('Prix invalide');
      return;
    }
    await callAPI('/counter-offer', { counter_price: price });
    setShowPriceInput(false);
    setPriceInput('');
  };

  const handleCancelNegotiation = () => {
    const msg = t('chat.negotiation.cancel') === 'Annuler la négociation'
      ? 'Annuler la négociation ? Les fonds bloqués seront libérés.'
      : 'Ghairi mazungumzo? Fedha zilizowekwa zitafunguliwa.';
    if (confirm(msg)) {
      callAPI('/cancel-negotiation');
    }
  };

  const handleConfirmFinalPrice = () => {
    const msg = t('chat.negotiation.confirm') === 'Confirmer'
      ? 'Confirmer ce prix et continuer la transaction ?'
      : 'Thibitisha bei hii na kuendelea na biashara?';
    if (confirm(msg)) {
      callAPI('/confirm-final-price');
    }
  };

  return (
    <div className="flex flex-col h-[500px] border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 shadow-sm">
      <div className="bg-gray-50 dark:bg-gray-900 p-4 border-b border-gray-100 dark:border-gray-700 rounded-t-xl">
        <h3 className="font-bold text-gray-700 dark:text-gray-200">{t('chat.title')}</h3>
        {isNegotiation && isEscrowOpen && (
          <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              {t('chat.negotiation.active')} <strong>{order?.proposed_price} ADA</strong>
            </p>
          </div>
        )}
      </div>
      
      {/* Boutons d'action de négociation */}
      {isNegotiation && isEscrowOpen && (
        <div className="p-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 space-y-2">
          {isBuyer && (
            <>
              {!showPriceInput ? (
                <button
                  onClick={() => setShowPriceInput(true)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                >
                  <DollarSign className="w-4 h-4" />
                  {t('chat.negotiation.confirm_price')}
                </button>
              ) : (
                <div className="space-y-2">
                  <input
                    type="number"
                    value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value)}
                    placeholder={t('chat.negotiation.new_price')}
                    className="w-full p-2 border dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleConfirmFinalPrice}
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      {t('chat.negotiation.confirm')}
                    </button>
                    <button
                      onClick={() => { setShowPriceInput(false); setPriceInput(''); }}
                      className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm"
                    >
                      {t('chat.negotiation.cancel_confirm')}
                    </button>
                  </div>
                </div>
              )}
              <button
                onClick={handleCancelNegotiation}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                {t('chat.negotiation.cancel')}
              </button>
            </>
          )}

          {isSeller && (
            <>
              <div className="flex gap-2">
                <button
                  onClick={handleAcceptPrice}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  {t('chat.negotiation.accept')}
                </button>
                <button
                  onClick={() => setShowPriceInput(true)}
                  disabled={loading || showPriceInput}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition disabled:opacity-50"
                >
                  <MessageSquare className="w-4 h-4" />
                  {t('chat.negotiation.counter')}
                </button>
              </div>
              {showPriceInput && (
                <div className="space-y-2">
                  <input
                    type="number"
                    value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value)}
                    placeholder={t('chat.negotiation.counter_price')}
                    className="w-full p-2 border dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCounterOffer}
                      disabled={loading}
                      className="flex-1 px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {t('chat.negotiation.send')}
                    </button>
                    <button
                      onClick={() => { setShowPriceInput(false); setPriceInput(''); }}
                      className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm"
                    >
                      {t('chat.negotiation.cancel_confirm')}
                    </button>
                  </div>
                </div>
              )}
              <button
                onClick={handleCancelNegotiation}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                {t('chat.negotiation.refuse')}
              </button>
            </>
          )}
        </div>
      )}

      {/* Bouton pour démarrer une négociation (acheteur seulement, si pas encore en négociation) */}
      {!isNegotiation && isBuyer && order?.status === 'pending' && (
        <div className="p-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          {!showPriceInput ? (
            <button
              onClick={() => setShowPriceInput(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
            >
                  <DollarSign className="w-4 h-4" />
                  {t('chat.negotiation.propose')}
                </button>
              ) : (
                <div className="space-y-2">
                  <input
                    type="number"
                    value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value)}
                    placeholder={t('chat.negotiation.propose_amount')}
                    className="w-full p-2 border dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleProposePrice}
                      disabled={loading}
                      className="flex-1 px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {t('chat.negotiation.propose_and_block')}
                    </button>
                <button
                  onClick={() => { setShowPriceInput(false); setPriceInput(''); }}
                  className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
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
    </div>
  );
};

export default ChatBox;
