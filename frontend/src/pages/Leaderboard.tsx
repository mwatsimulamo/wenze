import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getWZPLeaderboard, LeaderboardUser } from '../utils/getWZPLeaderboard';
import { 
  Trophy, 
  Award, 
  Medal, 
  Crown, 
  ArrowLeft,
  CheckCircle,
  Loader2,
  Gift,
  TrendingUp,
  Search,
  Star,
  Sparkles,
  X,
  User,
  Wallet
} from 'lucide-react';

const Leaderboard = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  // Fermer les suggestions quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchInputRef.current && 
        !searchInputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      // Charger au moins 50 utilisateurs pour les récompenses
      const data = await getWZPLeaderboard(200);
      setLeaderboard(data);
    } catch (err: any) {
      console.error('Erreur lors du chargement du classement:', err);
      setError('Impossible de charger le classement. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  // Recherche intelligente avec highlight
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return {
        exact: [],
        partial: [],
        suggestions: []
      };
    }

    const query = searchQuery.toLowerCase().trim();
    const words = query.split(/\s+/).filter(w => w.length > 0);

    // Fonction pour calculer la pertinence
    const calculateRelevance = (user: LeaderboardUser): { score: number; matchType: 'exact' | 'start' | 'contains' | 'word' } => {
      const fullName = (user.full_name || '').toLowerCase();
      const username = (user.username || '').toLowerCase();
      const combined = `${fullName} ${username}`.trim();

      // Recherche exacte (nom complet ou username)
      if (fullName === query || username === query) {
        return { score: 100, matchType: 'exact' };
      }

      // Commence par la recherche
      if (fullName.startsWith(query) || username.startsWith(query)) {
        return { score: 80, matchType: 'start' };
      }

      // Contient la recherche
      if (combined.includes(query)) {
        return { score: 60, matchType: 'contains' };
      }

      // Recherche par mots (si plusieurs mots)
      if (words.length > 1) {
        const allWordsMatch = words.every(word => 
          fullName.includes(word) || username.includes(word)
        );
        if (allWordsMatch) {
          return { score: 70, matchType: 'word' };
        }
      }

      // Recherche de mots individuels
      const wordMatches = words.filter(word => 
        fullName.includes(word) || username.includes(word)
      ).length;
      
      if (wordMatches > 0) {
        return { score: 40 + (wordMatches / words.length) * 30, matchType: 'word' };
      }

      return { score: 0, matchType: 'contains' };
    };

    // Trier tous les résultats par pertinence
    const allResults = leaderboard
      .map(user => ({
        user,
        ...calculateRelevance(user)
      }))
      .filter(result => result.score > 0)
      .sort((a, b) => {
        // D'abord par score
        if (b.score !== a.score) return b.score - a.score;
        // Ensuite par rang (plus haut = mieux)
        const rankA = leaderboard.indexOf(a.user) + 1;
        const rankB = leaderboard.indexOf(b.user) + 1;
        return rankA - rankB;
      })
      .map(result => result.user);

    // Suggestions limitées à 5 pour l'autocomplete
    const suggestions = allResults.slice(0, 5);

    // Séparer les résultats exacts/commençant par vs partiels
    const exact = allResults.filter(u => {
      const fn = (u.full_name || '').toLowerCase();
      const un = (u.username || '').toLowerCase();
      return fn === query || un === query || fn.startsWith(query) || un.startsWith(query);
    });

    const partial = allResults.filter(u => !exact.includes(u));

    return { exact, partial, suggestions };
  }, [leaderboard, searchQuery]);

  // Filtrer par recherche pour l'affichage
  const filteredLeaderboard = useMemo(() => {
    if (!searchQuery.trim()) return leaderboard;
    return [...searchResults.exact, ...searchResults.partial];
  }, [leaderboard, searchQuery, searchResults]);

  // Fonction pour mettre en évidence le texte correspondant
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const words = query.trim().split(/\s+/).filter(w => w.length > 0);
    let highlightedText = text;
    
    words.forEach(word => {
      const regex = new RegExp(`(${word})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark class="bg-yellow-200 text-gray-900 font-semibold">$1</mark>');
    });
    
    return highlightedText;
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setShowSuggestions(value.length > 0);
    setHighlightedIndex(-1);
  };

  const handleSelectSuggestion = (selectedUser: LeaderboardUser) => {
    setSearchQuery(selectedUser.full_name || selectedUser.username || '');
    setShowSuggestions(false);
    // Scroll vers l'utilisateur sélectionné
    setTimeout(() => {
      const element = document.getElementById(`user-${selectedUser.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('animate-pulse');
        setTimeout(() => element.classList.remove('animate-pulse'), 2000);
      }
    }, 100);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    searchInputRef.current?.focus();
  };

  // Navigation au clavier dans les suggestions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || searchResults.suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => 
        prev < searchResults.suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      handleSelectSuggestion(searchResults.suggestions[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    }
  };

  // Séparer top 3, top 4-50, et reste
  // Note: filteredLeaderboard est déjà trié par total_wzp décroissant depuis getWZPLeaderboard
  const top3 = useMemo(() => filteredLeaderboard.slice(0, 3), [filteredLeaderboard]);
  const top4to50 = useMemo(() => filteredLeaderboard.slice(3, 50), [filteredLeaderboard]);
  const rest = useMemo(() => filteredLeaderboard.slice(50), [filteredLeaderboard]);

  const getRankIcon = (rank: number) => {
    if (rank === 1) {
      return <Crown className="w-7 h-7 text-yellow-500" />;
    } else if (rank === 2) {
      return <Medal className="w-6 h-6 text-gray-400" />;
    } else if (rank === 3) {
      return <Medal className="w-6 h-6 text-amber-600" />;
    }
    return null;
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white shadow-lg';
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white shadow-md';
    if (rank === 3) return 'bg-gradient-to-r from-amber-500 to-amber-700 text-white shadow-md';
    if (rank <= 50) return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow';
    return 'bg-gray-100 text-gray-700';
  };

  const getInitials = (fullName: string | null, username: string | null) => {
    if (fullName) {
      const names = fullName.trim().split(' ');
      if (names.length >= 2) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
      }
      return fullName.substring(0, 2).toUpperCase();
    }
    if (username) {
      return username.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const getUserRank = (userId: string) => {
    const index = leaderboard.findIndex(u => u.id === userId);
    return index >= 0 ? index + 1 : null;
  };

  const currentUserRank = useMemo(() => {
    if (!user) return null;
    return getUserRank(user.id);
  }, [leaderboard, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
            <p className="text-gray-600 text-lg">Chargement du classement...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center max-w-md mx-auto">
            <p className="text-red-600 text-lg mb-4">{error}</p>
            <button
              onClick={fetchLeaderboard}
              className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors font-semibold"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-violet-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* En-tête compact */}
        <div className="mb-6">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-primary mb-4 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </Link>

          <div className="bg-gradient-to-r from-primary via-blue-500 to-violet-500 rounded-3xl p-6 sm:p-8 text-white shadow-2xl">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Trophy className="w-10 h-10 sm:w-12 sm:h-12" />
                  <h1 className="text-3xl sm:text-4xl font-bold">WZP</h1>
                </div>
                <p className="text-blue-100 text-base sm:text-lg">
                  Classement des utilisateurs les plus actifs
                </p>
              </div>
              {currentUserRank && (
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/30">
                    <div className="text-blue-100 text-sm mb-1">Votre rang</div>
                    <div className="text-3xl font-bold text-white">{currentUserRank}</div>
                  </div>
                  {currentUserRank <= 50 && user && (
                    <Link
                      to="/rewards/claim"
                      className="bg-white/90 hover:bg-white text-purple-600 font-bold px-6 py-4 rounded-2xl border-2 border-white/50 shadow-lg hover:shadow-xl transition-all flex items-center gap-2 whitespace-nowrap"
                    >
                      <Gift className="w-5 h-5" />
                      <span className="hidden sm:inline">Réclamer</span>
                      <span className="sm:hidden">🏆</span>
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Barre de recherche améliorée avec autocomplete */}
        <div className="mb-6 relative" ref={searchInputRef}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Rechercher un utilisateur par nom ou username..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => searchQuery && setShowSuggestions(true)}
              className="w-full pl-12 pr-12 py-4 bg-white rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-none text-base shadow-lg focus:shadow-xl transition-all"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Effacer la recherche"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Suggestions d'autocomplete */}
          {showSuggestions && searchResults.suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute z-50 w-full mt-2 bg-white rounded-xl border-2 border-gray-200 shadow-2xl max-h-80 overflow-y-auto"
            >
              {searchResults.suggestions.map((suggestion, index) => {
                const rank = getUserRank(suggestion.id);
                const isHighlighted = index === highlightedIndex;

                return (
                  <button
                    key={suggestion.id}
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-purple-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                      isHighlighted ? 'bg-purple-100' : ''
                    }`}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {suggestion.avatar_url ? (
                        <img
                          src={suggestion.avatar_url}
                          alt={suggestion.full_name || suggestion.username || 'User'}
                          className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center border-2 border-gray-200">
                          <span className="text-white font-bold text-xs">
                            {getInitials(suggestion.full_name, suggestion.username)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Nom avec highlight */}
                    <div className="flex-1 min-w-0">
                      <div
                        className="font-semibold text-gray-900 truncate"
                        dangerouslySetInnerHTML={{
                          __html: highlightText(
                            suggestion.full_name || suggestion.username || 'Utilisateur',
                            searchQuery
                          )
                        }}
                      />
                      {suggestion.username && suggestion.full_name && (
                        <div
                          className="text-sm text-gray-500 truncate"
                          dangerouslySetInnerHTML={{
                            __html: highlightText(suggestion.username, searchQuery)
                          }}
                        />
                      )}
                    </div>

                    {/* Rang et points */}
                    <div className="flex-shrink-0 text-right">
                      {rank && (
                        <div className="text-xs text-gray-500 mb-1">Rang #{rank}</div>
                      )}
                      <div className="flex items-center gap-1 text-purple-600">
                        <Award className="w-4 h-4" />
                        <span className="font-bold">{suggestion.total_wzp.toFixed(1)}</span>
                        <span className="text-xs">WZP</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Résultat de recherche - compteur */}
          {searchQuery && filteredLeaderboard.length > 0 && (
            <div className="mt-3 text-sm text-gray-600 flex items-center gap-2">
              <Search className="w-4 h-4" />
              <span>
                <strong>{filteredLeaderboard.length}</strong> résultat{filteredLeaderboard.length > 1 ? 's' : ''} trouvé{filteredLeaderboard.length > 1 ? 's' : ''} pour "{searchQuery}"
              </span>
            </div>
          )}
        </div>

        {/* Top 3 - Version compacte mais visible */}
        {top3.length >= 3 && !searchQuery && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[1, 0, 2].map((displayIndex) => {
              const user = top3[displayIndex];
              // Le rang réel est basé sur la position dans top3 (qui est déjà trié)
              // top3[0] = rang 1 (le meilleur), top3[1] = rang 2, top3[2] = rang 3
              // On affiche visuellement: top3[1] (rang 2) à gauche, top3[0] (rang 1) au centre, top3[2] (rang 3) à droite
              // Donc le rang réel = displayIndex + 1 (car top3[0] est le 1er, top3[1] est le 2ème, etc.)
              const realRank = displayIndex + 1; // displayIndex 0 = rang 1, displayIndex 1 = rang 2, displayIndex 2 = rang 3
              if (!user) return null;

              return (
                <div key={user.id} className={realRank === 1 ? 'md:order-2' : realRank === 2 ? 'md:order-1' : 'md:order-3'}>
                  <Link
                    to={`/seller/${user.id}`}
                    className={`block bg-white rounded-2xl border-2 p-5 sm:p-6 text-center relative transition-all hover:shadow-xl hover:scale-105 ${
                      realRank === 1
                        ? 'border-yellow-400 shadow-2xl bg-gradient-to-br from-yellow-50 to-amber-50'
                        : realRank === 2
                        ? 'border-gray-300 shadow-lg'
                        : 'border-amber-300 shadow-lg'
                    }`}
                  >
                    {/* Rang */}
                    <div className="absolute -top-5 left-1/2 transform -translate-x-1/2">
                      {realRank === 1 ? (
                        <Crown className="w-10 h-10 text-yellow-500" />
                      ) : (
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${getRankBadgeColor(realRank)}`}>
                          {realRank}
                        </div>
                      )}
                    </div>

                    {/* Avatar */}
                    <div className="mt-6 mb-4">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.full_name || user.username || 'User'}
                          className={`mx-auto rounded-full object-cover border-4 ${
                            realRank === 1
                              ? 'w-24 h-24 border-yellow-400 shadow-lg'
                              : 'w-20 h-20 border-gray-300'
                          }`}
                        />
                      ) : (
                        <div className={`mx-auto rounded-full bg-gradient-to-br flex items-center justify-center border-4 ${
                          realRank === 1
                            ? 'w-24 h-24 from-yellow-400 to-amber-600 border-yellow-400 shadow-lg'
                            : 'w-20 h-20 from-gray-400 to-gray-600 border-gray-300'
                        }`}>
                          <span className={`font-bold text-white ${realRank === 1 ? 'text-2xl' : 'text-xl'}`}>
                            {getInitials(user.full_name, user.username)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Nom */}
                    <h3 className="font-bold text-base sm:text-lg mb-1 truncate">
                      {user.full_name || user.username || 'Utilisateur'}
                    </h3>
                    {user.is_verified && (
                      <CheckCircle className="w-4 h-4 text-green-500 mx-auto mb-2" />
                    )}

                    {/* Points */}
                    <div className="flex items-center justify-center gap-2 text-primary">
                      <Award className="w-5 h-5" />
                      <span className="font-bold text-xl">{user.total_wzp.toFixed(1)}</span>
                      <span className="text-sm text-gray-600">WZP</span>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        {/* Top 4-50 - Section récompenses mensuelles */}
        {top4to50.length > 0 && (
          <div className="mb-8">
            {!searchQuery && (
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 mb-4 shadow-xl">
                <div className="flex items-center gap-3 mb-2">
                  <Gift className="w-8 h-8 text-white" />
                  <h2 className="text-2xl sm:text-3xl font-bold text-white">
                    Top 50 - Récompenses Mensuelles
                  </h2>
                </div>
                <p className="text-purple-100 text-sm sm:text-base">
                  Les 50 premiers utilisateurs reçoivent des récompenses spéciales chaque mois
                </p>
              </div>
            )}

            <div className="bg-white rounded-2xl border-2 border-purple-200 shadow-xl overflow-hidden">
              <div className="divide-y divide-gray-100">
                {top4to50.map((leaderboardUser, index) => {
                  const rank = index + 4;
                  const isCurrentUser = leaderboardUser.id === user?.id;

                  return (
                    <Link
                      key={leaderboardUser.id}
                      id={`user-${leaderboardUser.id}`}
                      to={`/seller/${leaderboardUser.id}`}
                      className={`flex items-center gap-4 px-4 sm:px-6 py-4 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all ${
                        isCurrentUser ? 'bg-blue-50 border-l-4 border-primary' : ''
                      }`}
                    >
                      {/* Rang avec badge spécial */}
                      <div className="flex-shrink-0 w-12 text-center">
                        <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm ${getRankBadgeColor(rank)}`}>
                          {rank}
                        </span>
                      </div>

                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        {leaderboardUser.avatar_url ? (
                          <img
                            src={leaderboardUser.avatar_url}
                            alt={leaderboardUser.full_name || leaderboardUser.username || 'User'}
                            className="w-12 h-12 rounded-full object-cover border-2 border-purple-200"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center border-2 border-purple-200">
                            <span className="text-white font-bold text-sm">
                              {getInitials(leaderboardUser.full_name, leaderboardUser.username)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Nom avec highlight si recherche active */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {searchQuery ? (
                            <h3
                              className="font-semibold text-base text-gray-900"
                              dangerouslySetInnerHTML={{
                                __html: highlightText(
                                  leaderboardUser.full_name || leaderboardUser.username || 'Utilisateur',
                                  searchQuery
                                )
                              }}
                            />
                          ) : (
                            <h3 className="font-semibold text-base text-gray-900 truncate">
                              {leaderboardUser.full_name || leaderboardUser.username || 'Utilisateur'}
                            </h3>
                          )}
                          {leaderboardUser.is_verified && (
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          )}
                          {isCurrentUser && (
                            <span className="text-xs bg-primary text-white px-2 py-1 rounded-full font-medium">
                              Vous
                            </span>
                          )}
                          {rank <= 10 && !searchQuery && (
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              Top 10
                            </span>
                          )}
                        </div>
                        {searchQuery && leaderboardUser.username && leaderboardUser.full_name && (
                          <div
                            className="text-sm text-gray-500"
                            dangerouslySetInnerHTML={{
                              __html: highlightText(leaderboardUser.username, searchQuery)
                            }}
                          />
                        )}
                      </div>

                      {/* Points WZP */}
                      <div className="flex-shrink-0 text-right">
                        <div className="flex items-center gap-2 text-purple-600">
                          <Award className="w-5 h-5" />
                          <span className="font-bold text-lg">{leaderboardUser.total_wzp.toFixed(1)}</span>
                          <span className="text-sm text-gray-600">WZP</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Reste du classement (après le top 50) */}
        {rest.length > 0 && (
          <div className="mb-8">
            {!searchQuery && (
              <div className="bg-gray-800 rounded-2xl p-6 mb-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-7 h-7 text-white" />
                  <h2 className="text-2xl font-bold text-white">Classement Complet</h2>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
              <div className="divide-y divide-gray-100">
                {rest.map((leaderboardUser, index) => {
                  const rank = index + 51;
                  const isCurrentUser = leaderboardUser.id === user?.id;

                  return (
                    <Link
                      key={leaderboardUser.id}
                      id={`user-${leaderboardUser.id}`}
                      to={`/seller/${leaderboardUser.id}`}
                      className={`flex items-center gap-4 px-4 sm:px-6 py-3 hover:bg-gray-50 transition-colors ${
                        isCurrentUser ? 'bg-blue-50 border-l-4 border-primary' : ''
                      }`}
                    >
                      {/* Rang */}
                      <div className="flex-shrink-0 w-12 text-center">
                        <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm ${getRankBadgeColor(rank)}`}>
                          {rank}
                        </span>
                      </div>

                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        {leaderboardUser.avatar_url ? (
                          <img
                            src={leaderboardUser.avatar_url}
                            alt={leaderboardUser.full_name || leaderboardUser.username || 'User'}
                            className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center border-2 border-gray-200">
                            <span className="text-white font-bold text-sm">
                              {getInitials(leaderboardUser.full_name, leaderboardUser.username)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Nom avec highlight si recherche active */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {searchQuery ? (
                            <h3
                              className="font-semibold text-base text-gray-900"
                              dangerouslySetInnerHTML={{
                                __html: highlightText(
                                  leaderboardUser.full_name || leaderboardUser.username || 'Utilisateur',
                                  searchQuery
                                )
                              }}
                            />
                          ) : (
                            <h3 className="font-semibold text-base text-gray-900 truncate">
                              {leaderboardUser.full_name || leaderboardUser.username || 'Utilisateur'}
                            </h3>
                          )}
                          {leaderboardUser.is_verified && (
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          )}
                          {isCurrentUser && (
                            <span className="text-xs bg-primary text-white px-2 py-1 rounded-full font-medium">
                              Vous
                            </span>
                          )}
                        </div>
                        {searchQuery && leaderboardUser.username && leaderboardUser.full_name && (
                          <div
                            className="text-sm text-gray-500"
                            dangerouslySetInnerHTML={{
                              __html: highlightText(leaderboardUser.username, searchQuery)
                            }}
                          />
                        )}
                      </div>

                      {/* Points WZP */}
                      <div className="flex-shrink-0 text-right">
                        <div className="flex items-center gap-2 text-primary">
                          <Award className="w-4 h-4" />
                          <span className="font-bold text-base">{leaderboardUser.total_wzp.toFixed(1)}</span>
                          <span className="text-xs text-gray-600">WZP</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Message si aucun résultat de recherche */}
        {searchQuery && filteredLeaderboard.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">Aucun utilisateur trouvé pour "{searchQuery}"</p>
            <p className="text-gray-400 text-sm">Essayez avec un autre nom ou username</p>
            <button
              onClick={clearSearch}
              className="mt-4 px-4 py-2 text-primary hover:text-primary-dark font-medium"
            >
              Effacer la recherche
            </button>
          </div>
        )}

        {/* Message si aucun utilisateur */}
        {!searchQuery && leaderboard.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">Aucun utilisateur dans le classement pour le moment.</p>
            <p className="text-gray-400">Soyez le premier à gagner des points WZP !</p>
          </div>
        )}

        {/* Informations sur les récompenses */}
        {!searchQuery && (
          <div className="mt-8 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-6 sm:p-8 shadow-lg">
            <div className="flex items-start gap-4 mb-4">
              <Sparkles className="w-8 h-8 text-purple-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-xl text-gray-900 mb-3">Comment gagner des points WZP ?</h3>
                <ul className="text-gray-700 space-y-2 text-sm sm:text-base">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold mt-1">•</span>
                    <span>Gagnez <strong className="text-purple-700">0.25 WZP par ADA</strong> dépensé lors d'un achat réussi</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold mt-1">•</span>
                    <span>Gagnez <strong className="text-purple-700">0.25 WZP par ADA</strong> gagné lors d'une vente réussie</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold mt-1">•</span>
                    <span>Les points sont crédités automatiquement après chaque transaction complétée</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t-2 border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <Gift className="w-6 h-6 text-purple-600" />
                <h4 className="font-bold text-lg text-gray-900">Récompenses Mensuelles</h4>
              </div>
              <p className="text-gray-700 text-sm sm:text-base">
                Les <strong className="text-purple-700">50 premiers utilisateurs</strong> du classement reçoivent des récompenses spéciales chaque mois. 
                Plus vous êtes actif, plus vous montez dans le classement !
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
