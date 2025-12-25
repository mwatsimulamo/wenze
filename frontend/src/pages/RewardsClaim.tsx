import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  checkRewardEligibility,
  claimReward,
  getUserRewardClaims,
  RewardEligibility,
  RewardClaim,
  isValidCardanoAddress,
  getCurrentRewardPeriod,
} from '../utils/wzpRewards';
import {
  Gift,
  Trophy,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Wallet,
  AlertCircle,
  Loader2,
  ExternalLink,
  History,
} from 'lucide-react';

const RewardsClaim = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [eligibility, setEligibility] = useState<RewardEligibility | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [cardanoAddress, setCardanoAddress] = useState('');
  const [addressError, setAddressError] = useState<string | null>(null);
  const [previousClaims, setPreviousClaims] = useState<RewardClaim[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const { month, year } = getCurrentRewardPeriod();
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetchEligibility();
    fetchPreviousClaims();
  }, [user, navigate]);

  const fetchEligibility = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const result = await checkRewardEligibility(user.id);
      setEligibility(result);
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'éligibilité:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPreviousClaims = async () => {
    if (!user) return;

    try {
      const claims = await getUserRewardClaims(user.id);
      setPreviousClaims(claims);
    } catch (error) {
      console.error('Erreur lors de la récupération des réclamations:', error);
    }
  };

  const handleAddressChange = (value: string) => {
    setCardanoAddress(value);
    setAddressError(null);

    if (value && !isValidCardanoAddress(value)) {
      setAddressError('Adresse Cardano invalide. L\'adresse doit commencer par "addr" ou "addr_test"');
    }
  };

  const handleClaim = async () => {
    if (!user || !eligibility?.eligible) return;

    // Valider l'adresse
    if (!cardanoAddress.trim()) {
      setAddressError('Veuillez entrer votre adresse Cardano');
      return;
    }

    if (!isValidCardanoAddress(cardanoAddress)) {
      setAddressError('Adresse Cardano invalide');
      return;
    }

    try {
      setClaiming(true);
      setAddressError(null);

      const result = await claimReward(user.id, cardanoAddress.trim());

      if (result.success) {
        // Recharger les données
        await fetchEligibility();
        await fetchPreviousClaims();
        // Afficher un message de succès (vous pouvez utiliser un toast ici)
        alert(`✅ ${result.message}`);
      } else {
        setAddressError(result.message || 'Erreur lors de la réclamation');
      }
    } catch (error: any) {
      console.error('Erreur lors de la réclamation:', error);
      setAddressError(error.message || 'Erreur lors de la réclamation');
    } finally {
      setClaiming(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
            <Clock className="w-3 h-3" />
            En attente
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
            <Loader2 className="w-3 h-3 animate-spin" />
            En traitement
          </span>
        );
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            Envoyée
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
            <XCircle className="w-3 h-3" />
            Échouée
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
            <p className="text-gray-600 text-lg">Vérification de votre éligibilité...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-violet-50/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* En-tête */}
        <div className="mb-6">
          <Link
            to="/leaderboard"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-primary mb-4 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au classement
          </Link>

          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-6 sm:p-8 text-white shadow-2xl">
            <div className="flex items-center gap-3 mb-2">
              <Gift className="w-10 h-10 sm:w-12 sm:h-12" />
              <h1 className="text-3xl sm:text-4xl font-bold">Récompenses Mensuelles</h1>
            </div>
            <p className="text-purple-100 text-base sm:text-lg">
              Réclamez vos récompenses ADA basées sur votre classement WZP
            </p>
          </div>
        </div>

        {/* Statut d'éligibilité */}
        {eligibility && (
          <div className={`rounded-2xl p-6 mb-6 border-2 ${
            eligibility.eligible
              ? 'bg-green-50 border-green-200'
              : eligibility.alreadyClaimed
              ? 'bg-blue-50 border-blue-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start gap-4">
              {eligibility.eligible ? (
                <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
              ) : (
                <AlertCircle className="w-8 h-8 text-red-600 flex-shrink-0 mt-1" />
              )}
              <div className="flex-1">
                <h2 className={`text-xl font-bold mb-2 ${
                  eligibility.eligible ? 'text-green-900' : 'text-red-900'
                }`}>
                  {eligibility.eligible
                    ? '✅ Vous êtes éligible pour réclamer votre récompense !'
                    : eligibility.alreadyClaimed
                    ? '✓ Vous avez déjà réclamé ce mois-ci'
                    : '❌ Vous n\'êtes pas éligible'}
                </h2>
                <p className={`text-base ${
                  eligibility.eligible ? 'text-green-800' : 'text-red-800'
                }`}>
                  {eligibility.message}
                </p>
                {eligibility.eligible && (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white/50 rounded-xl p-4">
                      <div className="text-sm text-green-700 mb-1">Votre Rang</div>
                      <div className="text-2xl font-bold text-green-900">#{eligibility.rank}</div>
                    </div>
                    <div className="bg-white/50 rounded-xl p-4">
                      <div className="text-sm text-green-700 mb-1">Points WZP</div>
                      <div className="text-2xl font-bold text-green-900">
                        {eligibility.wzpPoints?.toFixed(1)}
                      </div>
                    </div>
                    <div className="bg-white/50 rounded-xl p-4">
                      <div className="text-sm text-green-700 mb-1">Récompense Estimée</div>
                      <div className="text-2xl font-bold text-green-900">
                        {eligibility.estimatedReward?.toFixed(2)} ADA
                      </div>
                    </div>
                  </div>
                )}
                {eligibility.alreadyClaimed && eligibility.currentClaim && (
                  <div className="mt-4 bg-white/50 rounded-xl p-4">
                    <div className="text-sm text-blue-700 mb-2">Réclamation du {monthNames[eligibility.currentClaim.month - 1]} {eligibility.currentClaim.year}</div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-lg font-bold text-blue-900">
                          {eligibility.currentClaim.reward_ada.toFixed(2)} ADA
                        </div>
                        <div className="text-sm text-blue-700">
                          Rang #{eligibility.currentClaim.rank_position}
                        </div>
                      </div>
                      {getStatusBadge(eligibility.currentClaim.status)}
                    </div>
                    {eligibility.currentClaim.tx_hash && (
                      <a
                        href={`https://preprod.cardanoscan.io/transaction/${eligibility.currentClaim.tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mt-2"
                      >
                        Voir la transaction <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Formulaire de réclamation */}
        {eligibility?.eligible && (
          <div className="bg-white rounded-2xl border-2 border-purple-200 shadow-xl p-6 sm:p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Réclamer votre récompense - {monthNames[month - 1]} {year}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Adresse Cardano (Bech32)
                </label>
                <div className="relative">
                  <Wallet className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={cardanoAddress}
                    onChange={(e) => handleAddressChange(e.target.value)}
                    placeholder="addr1... ou addr_test1..."
                    className={`w-full pl-12 pr-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none transition-colors font-mono text-sm ${
                      addressError
                        ? 'border-red-300 focus:border-red-500'
                        : 'border-gray-200 focus:border-purple-500'
                    }`}
                    disabled={claiming}
                  />
                </div>
                {addressError && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {addressError}
                  </p>
                )}
                <p className="mt-2 text-xs text-gray-500">
                  Entrez votre adresse Cardano où vous souhaitez recevoir la récompense. 
                  Cette adresse doit être valide et commencer par "addr" ou "addr_test".
                </p>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-purple-700 mb-1">Montant de la récompense</div>
                    <div className="text-3xl font-bold text-purple-900">
                      {eligibility.estimatedReward?.toFixed(2)} ADA
                    </div>
                  </div>
                  <Trophy className="w-12 h-12 text-purple-500" />
                </div>
              </div>

              <button
                onClick={handleClaim}
                disabled={claiming || !cardanoAddress.trim() || !!addressError}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                  claiming || !cardanoAddress.trim() || !!addressError
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl'
                }`}
              >
                {claiming ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Traitement en cours...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Gift className="w-5 h-5" />
                    Réclamer ma récompense
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Historique des réclamations */}
        {previousClaims.length > 0 && (
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl overflow-hidden">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <History className="w-5 h-5 text-gray-600" />
                <h2 className="text-xl font-bold text-gray-900">Historique des réclamations</h2>
              </div>
              <span className="text-sm text-gray-500">
                {previousClaims.length} réclamation{previousClaims.length > 1 ? 's' : ''}
              </span>
            </button>

            {showHistory && (
              <div className="divide-y divide-gray-100">
                {previousClaims.map((claim) => (
                  <div key={claim.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between flex-wrap gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-lg text-gray-900">
                            {monthNames[claim.month - 1]} {claim.year}
                          </h3>
                          {getStatusBadge(claim.status)}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="text-gray-500 mb-1">Rang</div>
                            <div className="font-semibold text-gray-900">#{claim.rank_position}</div>
                          </div>
                          <div>
                            <div className="text-gray-500 mb-1">Points WZP</div>
                            <div className="font-semibold text-gray-900">
                              {claim.wzp_points.toFixed(1)}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-500 mb-1">Récompense</div>
                            <div className="font-semibold text-green-600">
                              {claim.reward_ada.toFixed(2)} ADA
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-500 mb-1">Date</div>
                            <div className="font-semibold text-gray-900">
                              {new Date(claim.created_at).toLocaleDateString('fr-FR')}
                            </div>
                          </div>
                        </div>
                        <div className="mt-3">
                          <div className="text-xs text-gray-500 mb-1">Adresse de réception</div>
                          <div className="font-mono text-sm text-gray-700 break-all">
                            {claim.cardano_address}
                          </div>
                        </div>
                        {claim.tx_hash && (
                          <a
                            href={`https://preprod.cardanoscan.io/transaction/${claim.tx_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800 mt-3"
                          >
                            Voir la transaction <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Informations */}
        <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
          <h3 className="font-bold text-lg text-blue-900 mb-3">Comment fonctionne le système de récompenses ?</h3>
          <ul className="text-blue-800 space-y-2 text-sm sm:text-base">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold mt-1">•</span>
              <span>Les <strong>50 premiers utilisateurs</strong> du classement peuvent réclamer une récompense mensuelle</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold mt-1">•</span>
              <span>La récompense est calculée selon votre <strong>rang</strong> et vos <strong>points WZP</strong></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold mt-1">•</span>
              <span>Vous pouvez réclamer <strong>une seule fois par mois</strong></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold mt-1">•</span>
              <span>Les récompenses sont envoyées à l'adresse Cardano que vous fournissez</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RewardsClaim;

