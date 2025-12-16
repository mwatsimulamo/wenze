import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { MessageCircle, X, Send, Bot, Loader2 } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface KnowledgeEntry {
  keywords: string[];
  content: string;
  category: string;
}

// Base de connaissances Cardano étendue avec sujets complexes
const cardanoKnowledgeBase: Record<string, KnowledgeEntry[]> = {
  fr: [
    {
      keywords: ['cardano', 'blockchain', 'troisième génération', '3ème génération'],
      category: 'général',
      content: 'Cardano est une blockchain de troisième génération fondée par Charles Hoskinson, co-fondateur d\'Ethereum. Elle utilise la preuve d\'enjeu (Proof of Stake) via Ouroboros pour une consommation d\'énergie réduite (~0.001% d\'Ethereum), une meilleure scalabilité et une sécurité mathématiquement prouvée. Cardano se distingue par son approche scientifique rigoureuse, avec peer-review de toutes ses recherches.'
    },
    {
      keywords: ['ada', 'cryptomonnaie', 'monnaie', 'lovelace'],
      category: 'ada',
      content: 'ADA est la cryptomonnaie native de Cardano, nommée d\'après Ada Lovelace, considérée comme la première programmeuse informatique. 1 ADA = 1,000,000 Lovelaces (unité la plus petite). ADA sert à : payer les frais de transaction, participer au staking pour sécuriser le réseau, voter dans le système de gouvernance (CIP), et est utilisée comme garantie dans les smart contracts. L\'approvisionnement maximum est de 45 milliards d\'ADA.'
    },
    {
      keywords: ['wallet', 'portefeuille', 'nami', 'eternl', 'lace', 'yoroi', 'flint', 'vespr'],
      category: 'wallets',
      content: 'Un wallet Cardano stocke vos clés privées et permet d\'envoyer/recevoir des ADA, gérer les NFTs, déléguer au staking, et interagir avec les DApps. Principaux wallets : Nami (extension navigateur), Eternl (multi-fonctions avancé), Lace (officiel IOG, léger), Yoroi (officiel Emurgo, simple), Flint (Chrome extension), Vespr (mobile). WENZE supporte tous ces wallets via CIP-30. Les wallets utilisent des clés privées que vous devez garder en sécurité - si vous les perdez, vos fonds sont perdus à jamais.'
    },
    {
      keywords: ['transaction', 'frais', 'fees', 'envoyer', 'recevoir', 'transfert'],
      category: 'transactions',
      content: 'Les transactions sur Cardano sont rapides (environ 20 secondes pour confirmation) et peu coûteuses (environ 0.17 ADA, soit ~$0.10). Chaque transaction nécessite des frais minimaux calculés par : base_fee (0.155381 ADA) + (taille_transaction × 0.000043946 ADA/byte). Cardano supporte les transactions multi-assets (native tokens), les smart contracts, les metadata, et les références d\'inputs (CIP-31) pour réduire les coûts.'
    },
    {
      keywords: ['staking', 'délégation', 'stake pool', 'pool', 'récompenses', 'delegation'],
      category: 'staking',
      content: 'Le staking (délégation) permet de gagner des récompenses ADA (~4-5% APY) en déléguant vos ADA à un stake pool sans perdre le contrôle de vos fonds. Vous pouvez unstake à tout moment (pas de période de verrouillage). Les récompenses sont distribuées toutes les 5 jours (epoch). Choisissez un pool avec : bon pledge (engagement opérateur), saturation <100%, fees raisonnables (0-5%), et performance >95%. Vous gardez toujours le contrôle de vos ADA - la délégation n\'est pas un transfert.'
    },
    {
      keywords: ['smart contract', 'plutus', 'aiken', 'dapp', 'décentralisé', 'contrat intelligent'],
      category: 'smart-contracts',
      content: 'Les smart contracts sur Cardano sont écrits en Plutus (basé sur Haskell, sécurité fonctionnelle) ou Aiken (syntaxe moderne, plus simple). Ils permettent d\'automatiser des transactions selon des conditions définies. L\'EVM (Extended UTXO Model) de Cardano permet d\'exécuter des smart contracts directement dans les UTXOs, offrant meilleure prévisibilité des coûts et sécurité. Sur WENZE, notre système d\'escrow utilise des smart contracts Plutus pour sécuriser les transactions entre acheteurs et vendeurs, verrouillant les fonds jusqu\'à confirmation de livraison.'
    },
    {
      keywords: ['escrow', 'séquestre', 'wenze', 'sécurisé', 'transaction sécurisée'],
      category: 'escrow',
      content: 'L\'escrow (séquestre) est un smart contract qui verrouille les fonds jusqu\'à ce que certaines conditions soient remplies. Sur WENZE, l\'escrow protège les acheteurs et vendeurs : les fonds ADA sont verrouillés dans un contrat Plutus jusqu\'à ce que l\'acheteur confirme la réception du produit. Si un problème survient, un mécanisme de timeout permet le remboursement. Le contrat est immutable et vérifiable sur la blockchain, garantissant transparence et sécurité totale.'
    },
    {
      keywords: ['ouroboros', 'consensus', 'proof of stake', 'preuve d\'enjeu', 'pos'],
      category: 'consensus',
      content: 'Ouroboros est le protocole de consensus de Cardano utilisant la Preuve d\'Enjeu (PoS). C\'est le premier PoS prouvé mathématiquement sécurisé. Ouroboros garantit : sécurité équivalente à Bitcoin avec consommation énergétique minime, décentralisation (pas de pools dominants), et scalabilité (millions de transactions par seconde potentiel). Le réseau est divisé en epochs (5 jours) et slots (1 seconde), avec des validateurs (stake pools) élus de manière aléatoire mais pondérée par leur stake.'
    },
    {
      keywords: ['plutus', 'haskell', 'programmation', 'langage', 'code'],
      category: 'plutus',
      content: 'Plutus est le langage de programmation fonctionnel pour écrire des smart contracts sur Cardano. Basé sur Haskell, il offre une sécurité mathématique élevée grâce au système de types fort. Plutus Core compile vers une machine virtuelle (Plutus VM) qui exécute sur la blockchain. Les contrats Plutus sont vérifiables formellement, réduisant les bugs critiques. Aiken est une alternative moderne avec une syntaxe plus simple mais compile aussi vers Plutus Core pour compatibilité.'
    },
    {
      keywords: ['utxo', 'output', 'input', 'modèle', 'eutxo'],
      category: 'utxo',
      content: 'Cardano utilise le modèle UTXO (Unspent Transaction Output) étendu (EUTXO). Chaque transaction consomme des UTXOs (inputs) et crée de nouveaux UTXOs (outputs). Ce modèle offre : meilleure parallélisation (plusieurs transactions simultanées), prévisibilité des coûts, et sécurité (pas de reentrancy comme dans l\'account model). Les smart contracts dans EUTXO s\'exécutent avant la validation, garantissant que seules les transactions valides sont incluses dans la blockchain.'
    },
    {
      keywords: ['gouvernance', 'vote', 'cip', 'catalyst', 'voltaire'],
      category: 'governance',
      content: 'Cardano utilise un système de gouvernance décentralisée appelé Voltaire. Les détenteurs d\'ADA peuvent voter sur les CIPs (Cardano Improvement Proposals) et recevoir des récompenses pour leur participation. Project Catalyst distribue des fonds du trésor Cardano (funding) à des projets communautaires votés démocratiquement. Le système permet une évolution décentralisée de la blockchain sans dépendre d\'une autorité centrale.'
    },
    {
      keywords: ['nft', 'token', 'native token', 'token natif', 'fungible'],
      category: 'tokens',
      content: 'Cardano supporte les native tokens (tokens natifs) sans smart contracts. Cela signifie que les tokens et NFTs sont de première classe sur la blockchain, avec les mêmes garanties de sécurité qu\'ADA. Les frais pour transférer des tokens natifs sont identiques aux frais ADA (très économiques). Cardano supporte aussi les NFTs avec metadata standardisés (CIP-25), permettant de créer des collections complètes directement sur-chain.'
    },
    {
      keywords: ['hydra', 'scalabilité', 'layer 2', 'solution échelle'],
      category: 'scalability',
      content: 'Hydra est une solution de scaling Layer 2 pour Cardano permettant d\'atteindre des millions de transactions par seconde. Hydra crée des "têtes" (heads) - des canaux de paiement off-chain entre participants. Les transactions dans une tête sont instantanées et gratuites, seuls les ouvertures/fermetures nécessitent une transaction on-chain. Chaque tête peut traiter 1000 TPS, et le réseau peut supporter des milliers de têtes simultanément.'
    },
    {
      keywords: ['charles hoskinson', 'iohk', 'iog', 'fondateur', 'créateur'],
      category: 'history',
      content: 'Cardano a été fondée par Charles Hoskinson, co-fondateur d\'Ethereum. Le projet est développé par IOG (Input Output Global, anciennement IOHK) en collaboration avec la Cardano Foundation et Emurgo. Cardano se distingue par son approche peer-reviewed, avec toutes les recherches publiées et vérifiées par la communauté scientifique avant implémentation. Le projet est open-source et décentralisé.'
    },
    {
      keywords: ['sécurité', 'sécurisé', 'sûr', 'protection', 'risque'],
      category: 'security',
      content: 'Cardano priorise la sécurité via : preuves mathématiques formelles pour Ouroboros, système de types fort en Plutus (prévention d\'erreurs), modèle EUTXO (pas de reentrancy), audit de code régulier, et approche peer-reviewed pour toutes les innovations. Le réseau n\'a jamais subi de hack majeur depuis son lancement en 2017. Les wallets utilisent des standards de sécurité stricts (CIP-30) pour interactions avec DApps.'
    },
    {
      keywords: ['epoch', 'slot', 'temps', 'bloc', 'block'],
      category: 'epochs',
      content: 'Cardano divise le temps en epochs (5 jours) et slots (1 seconde). Chaque epoch contient ~432,000 slots. Un slot leader (stake pool) est élu pour chaque slot pour créer un bloc. Si un slot leader ne produit pas de bloc, le slot reste vide (pas de pénalité). Les récompenses de staking sont calculées par epoch et distribuées 2 epochs plus tard. Les paramètres réseau peuvent être ajustés entre epochs via gouvernance.'
    }
  ],
  sw: [
    {
      keywords: ['cardano', 'blockchain', 'kizazi cha tatu', '3'],
      category: 'général',
      content: 'Cardano ni blockchain ya kizazi cha tatu iliyoanzishwa na Charles Hoskinson, mwanzilishi wa Ethereum. Inatumia uthibitisho wa steki (Proof of Stake) kupitia Ouroboros kwa matumizi ya chini ya nishati (~0.001% ya Ethereum), uwezo bora, na usalama uliothibitishwa kihisabati. Cardano inajulikana kwa mbinu yake ya kisayansi, na utafiti wote unakaguliwa na wataalamu kabla ya kutekelezwa.'
    },
    {
      keywords: ['ada', 'fedha', 'lovelace'],
      category: 'ada',
      content: 'ADA ni fedha za kidijitali za asili za Cardano, zilizopewa jina la Ada Lovelace, mwanaprogramu wa kwanza. 1 ADA = 1,000,000 Lovelaces (kipimo kidogo zaidi). ADA hutumika kwa: kulipa ada za biashara, kushiriki katika staking kuhakikisha mtandao, kupiga kura katika mfumo wa utawala (CIP), na kutumika kama dhamana katika mikataba mahiri. Jumla ya juu ni ADA bilioni 45.'
    },
    {
      keywords: ['wallet', 'mkoba', 'nami', 'eternl', 'lace', 'yoroi', 'flint'],
      category: 'wallets',
      content: 'Mkoba wa Cardano huhifadhi funguo zako za siri na kuruhusu kutuma/kupokea ADA, kusimamia NFTs, kugawa kwa staking, na kuingiliana na DApps. Mifuko kuu: Nami (extension ya kivinjari), Eternl (mipango mbalimbali), Lace (rasmi IOG, nyepesi), Yoroi (rasmi Emurgo, rahisi), Flint (Chrome extension), Vespr (simu). WENZE inasaidia mifuko hii yote kupitia CIP-30. Funguo za siri lazima zihifadhiwe salama - ukiwa poteza, fedha zako zitaenda milele.'
    },
    {
      keywords: ['transaction', 'biashara', 'ada za', 'fees', 'kutuma', 'kupokea'],
      category: 'transactions',
      content: 'Biashara kwenye Cardano ni za haraka (sekunde 20 kwa uthibitisho) na za gharama ndogo (takriban 0.17 ADA, ~$0.10). Kila biashara inahitaji ada za chini zilizohesabiwa kwa: base_fee (0.155381 ADA) + (ukubwa_biashara × 0.000043946 ADA/byte). Cardano inasaidia biashara za multi-assets (tokens asili), mikataba mahiri, metadata, na marejeo ya inputs (CIP-31) kupunguza gharama.'
    },
    {
      keywords: ['staking', 'kugawa', 'stake pool', 'pool', 'zawadi', 'delegation'],
      category: 'staking',
      content: 'Kuweka steki (kugawa) kuruhusu kupata zawadi za ADA (~4-5% APY) kwa kugawa ADA zako kwenye bahari ya steki bila kupoteza udhibiti wa fedha zako. Unaweza kujiondoa wakati wowote (hakuna kufungwa). Zawadi husambazwa kila siku 5 (epoch). Chagua bahari na: pledge nzuri, saturation <100%, ada za kawaida (0-5%), na utendaji >95%. Daima una udhibiti wa ADA zako - kugawa si kuhamisha.'
    },
    {
      keywords: ['smart contract', 'mkataba mahiri', 'plutus', 'aiken', 'dapp'],
      category: 'smart-contracts',
      content: 'Mikataba mahiri kwenye Cardano imeandikwa kwa Plutus (msingi wa Haskell, usalama wa kazi) au Aiken (syntax ya kisasa, rahisi zaidi). Inaruhusu kufanya biashara kiotomatiki kulingana na masharti yaliyoainishwa. EVM ya Cardano inaruhusu kutekeleza mikataba mahiri moja kwa moja katika UTXOs, ikitoa utabiri bora wa gharama na usalama. Kwenye WENZE, mfumo wetu wa escrow hutumia mikataba mahiri ya Plutus kuhakikisha biashara kati ya wanunuzi na wauzaji, kufunga fedha hadi uthibitisho wa uwasilishaji.'
    },
    {
      keywords: ['escrow', 'kuhifadhi', 'wenze', 'salama'],
      category: 'escrow',
      content: 'Escrow (kuhifadhi) ni mkataba mahiri ambao hufunga fedha hadi masharti fulani yatimizwe. Kwenye WENZE, escrow hulinda wanunuzi na wauzaji: fedha za ADA zinafungwa katika mkataba wa Plutus hadi mkununuzi athibitishe kupokea bidhaa. Ikiwa shida itatokea, mfumo wa timeout huruhusu malipo ya kurudi. Mkataba hauwezi kubadilishwa na unaweza kuangaliwa kwenye blockchain, kuhakikisha uwazi na usalama kamili.'
    },
    {
      keywords: ['ouroboros', 'makubaliano', 'proof of stake', 'pos', 'uthibitisho'],
      category: 'consensus',
      content: 'Ouroboros ni itifaki ya makubaliano ya Cardano inayotumia Uthibitisho wa Steki (PoS). Ni PoS ya kwanza iliyothibitishwa kihisabati kwa usalama. Ouroboros inahakikisha: usalama sawa na Bitcoin kwa matumizi ya chini ya nishati, utawala usio na katikati (hakuna bahari kuu), na uwezo (mamilioni ya biashara kwa sekunde inawezekana). Mtandao umegawanywa katika epochs (siku 5) na slots (sekunde 1), na wathibitishaji (stake pools) huchaguliwa kwa nasibu lakini kwa uzito wa steki yao.'
    }
  ]
};

// Réponses génériques
const defaultResponses: Record<string, Record<string, string>> = {
  fr: {
    greeting: 'Bonjour ! Je suis votre assistant Cardano sur WENZE. Je peux répondre à vos questions complexes sur la blockchain Cardano, les wallets, les transactions, les smart contracts, le staking, la gouvernance, et bien plus encore. Posez-moi n\'importe quelle question !',
    unknown: 'Je comprends votre question sur Cardano. Voici quelques informations générales : Cardano est une blockchain de troisième génération qui utilise la preuve d\'enjeu (Ouroboros) pour une sécurité maximale et une consommation énergétique minimale. Les transactions sont rapides (~20s) et peu coûteuses (~0.17 ADA). Sur WENZE, nous utilisons des smart contracts Plutus pour sécuriser vos transactions via notre système d\'escrow. Souhaitez-vous en savoir plus sur un sujet spécifique ?',
    help: 'Je peux vous aider avec :\n• Informations détaillées sur Cardano et ADA\n• Wallets et sécurité\n• Smart contracts (Plutus, Aiken) et DApps\n• Staking et récompenses\n• Transactions et frais\n• Gouvernance et CIPs\n• NFTs et tokens natifs\n• Scalabilité (Hydra)\n• Architecture technique (EUTXO, Ouroboros)\n\nPosez-moi n\'importe quelle question, même complexe !',
  },
  sw: {
    greeting: 'Hujambo! Mimi ni msaidizi wako wa Cardano kwenye WENZE. Ninaweza kujibu maswali yako magumu kuhusu blockchain ya Cardano, mifuko, biashara, mikataba mahiri, staking, utawala, na mengine mengi. Niulize swali lolote!',
    unknown: 'Naelewa swali lako kuhusu Cardano. Hapa kuna taarifa za jumla: Cardano ni blockchain ya kizazi cha tatu inayotumia uthibitisho wa steki (Ouroboros) kwa usalama wa juu na matumizi ya chini ya nishati. Biashara ni za haraka (~20s) na za gharama ndogo (~0.17 ADA). Kwenye WENZE, tunatumia mikataba mahiri ya Plutus kuhakikisha biashara zako kupitia mfumo wetu wa escrow. Je, ungependa kujua zaidi kuhusu mada maalum?',
    help: 'Ninaweza kukusaidia na:\n• Taarifa za kina kuhusu Cardano na ADA\n• Mifuko na usalama\n• Mikataba mahiri (Plutus, Aiken) na DApps\n• Staking na zawadi\n• Biashara na ada\n• Utawala na CIPs\n• NFTs na tokens asili\n• Uwezo (Hydra)\n• Muundo wa kiufundi (EUTXO, Ouroboros)\n\nNiulize swali lolote, hata la ugumu!',
  }
};

const CardanoChatBot: React.FC = () => {
  const { language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialiser avec un message de bienvenue
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: '1',
        role: 'assistant',
        content: defaultResponses[language].greeting,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, language]);

  // Auto-scroll vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus sur l'input quand le chat s'ouvre
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Fonction améliorée pour rechercher dans la base de connaissances (recherche multi-mots et combinaison)
  const searchKnowledgeBase = (question: string): string | null => {
    const lowerQuestion = question.toLowerCase();
    const kb = cardanoKnowledgeBase[language] || [];
    
    // Nettoyer la question (supprimer la ponctuation mais garder les espaces)
    const cleanedQuestion = lowerQuestion.replace(/[.,!?;:()]/g, ' ');
    const words = cleanedQuestion.split(/\s+/).filter(w => w.length > 2); // Mots de plus de 2 caractères
    
    // Recherche avancée avec scoring
    const matches: Array<{ entry: KnowledgeEntry; score: number }> = [];
    
    for (const entry of kb) {
      let score = 0;
      let matchedKeywords = 0;
      
      for (const keyword of entry.keywords) {
        const keywordLower = keyword.toLowerCase();
        const keywordWords = keywordLower.split(/\s+/);
        
        // Vérifier correspondance exacte du mot-clé
        if (cleanedQuestion.includes(keywordLower)) {
          score += 10; // Score élevé pour correspondance exacte
          matchedKeywords++;
        } else {
          // Vérifier correspondance de mots individuels
          for (const keywordWord of keywordWords) {
            if (words.includes(keywordWord)) {
              score += 5; // Score moyen pour correspondance de mot
              matchedKeywords++;
            }
          }
        }
      }
      
      // Bonus pour longueur du contenu (plus détaillé = meilleur)
      if (matchedKeywords > 0) {
        score += entry.content.length / 100; // Bonus petit pour contenu détaillé
        matches.push({ entry, score });
      }
    }
    
    // Trier par score décroissant
    matches.sort((a, b) => b.score - a.score);
    
    // Retourner la meilleure correspondance ou combiner si plusieurs bonnes correspondances
    if (matches.length === 0) return null;
    
    const bestMatch = matches[0];
    if (bestMatch.score >= 10) {
      // Si on a une très bonne correspondance, la retourner seule
      return bestMatch.entry.content;
    } else if (matches.length > 1 && matches[1].score >= 5) {
      // Si on a plusieurs bonnes correspondances, les combiner
      const combined = matches.slice(0, 2).map(m => m.entry.content).join('\n\n');
      return combined;
    }
    
    return bestMatch.entry.content;
  };

  // Fonction améliorée pour appeler l'API OpenAI avec historique de conversation
  const callOpenAI = async (question: string, conversationHistory: ChatMessage[]): Promise<string> => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey) {
      return ''; // Pas d'API key, utiliser la base de connaissances
    }

    try {
      // Construire l'historique de conversation pour le contexte
      const historyMessages = conversationHistory.slice(-6).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const systemPrompt = language === 'fr' 
        ? `Tu es un expert en blockchain Cardano. Tu réponds de manière claire, détaillée et précise aux questions sur Cardano. 
        
Contexte WENZE : WENZE est une marketplace qui utilise des smart contracts Plutus (escrow) pour sécuriser les transactions entre acheteurs et vendeurs sur Cardano.

Connaissances clés sur Cardano :
- Blockchain de 3ème génération avec Ouroboros (PoS prouvé mathématiquement)
- Transactions rapides (~20s) et peu coûteuses (~0.17 ADA)
- Smart contracts en Plutus (Haskell) ou Aiken
- Staking avec ~4-5% APY, pas de verrouillage
- Modèle EUTXO (Extended UTXO) pour meilleure sécurité
- Native tokens et NFTs de première classe
- Gouvernance décentralisée (Voltaire, Catalyst)
- Scalabilité avec Hydra (Layer 2)

Réponds de manière complète et technique quand nécessaire. Si la question est complexe, donne des détails approfondis.`
        : `Wewe ni mtaalamu wa blockchain ya Cardano. Unajibu kwa uwazi, kwa kina na usahihi maswali kuhusu Cardano.

Muktadha wa WENZE: WENZE ni soko la mtandaoni linalotumia mikataba mahiri ya Plutus (escrow) kuhakikisha biashara kati ya wanunuzi na wauzaji kwenye Cardano.

Ujuzi muhimu kuhusu Cardano:
- Blockchain ya kizazi cha 3 na Ouroboros (PoS iliyothibitishwa kihisabati)
- Biashara za haraka (~20s) na za gharama ndogo (~0.17 ADA)
- Mikataba mahiri kwa Plutus (Haskell) au Aiken
- Staking na ~4-5% APY, hakuna kufungwa
- Mfano wa EUTXO kwa usalama bora
- Tokens asili na NFTs za daraja la kwanza
- Utawala usio na katikati (Voltaire, Catalyst)
- Uwezo na Hydra (Layer 2)

Jibu kwa ujumla na kitaalamu inapohitajika. Ikiwa swali ni la ugumu, toa maelezo ya kina.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini', // Utiliser gpt-4o-mini pour meilleures réponses à coût réduit
          messages: [
            { role: 'system', content: systemPrompt },
            ...historyMessages,
            { role: 'user', content: question },
          ],
          max_tokens: 800, // Plus de tokens pour réponses complexes
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('OpenAI API Error:', errorData);
        throw new Error('API Error');
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Erreur OpenAI:', error);
      return '';
    }
  };

  // Générer une réponse améliorée
  const generateResponse = async (question: string): Promise<string> => {
    // 1. Essayer OpenAI d'abord (si disponible) - avec historique de conversation
    const aiResponse = await callOpenAI(question, messages);
    if (aiResponse && aiResponse.trim().length > 50) {
      return aiResponse;
    }

    // 2. Rechercher dans la base de connaissances améliorée
    const kbAnswer = searchKnowledgeBase(question);
    if (kbAnswer) {
      return kbAnswer;
    }

    // 3. Réponse par défaut améliorée
    return defaultResponses[language].unknown;
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Générer la réponse avec contexte complet
    const response = await generateResponse(userMessage.content);
    
    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  const handleHelp = () => {
    const helpMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: defaultResponses[language].help,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, helpMessage]);
  };

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-primary to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 flex items-center justify-center group"
        aria-label={language === 'fr' ? 'Ouvrir le chat Cardano' : 'Fungua mazungumzo ya Cardano'}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
        )}
      </button>

      {/* Fenêtre de chat */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 h-[600px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden animate-fade-in">
          {/* En-tête */}
          <div className="bg-gradient-to-r from-primary to-blue-600 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">
                    {language === 'fr' ? 'Assistant Cardano' : 'Msaidizi wa Cardano'}
                  </h3>
                  <p className="text-xs text-blue-100">
                    {language === 'fr' ? 'IA avancée • En ligne' : 'AI ya hali ya juu • Hai mtandaoni'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleHelp}
                className="text-xs px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-full transition"
              >
                {language === 'fr' ? 'Aide' : 'Msaada'}
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                    msg.role === 'user'
                      ? 'bg-primary text-white rounded-br-md'
                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-2.5 border border-gray-200 dark:border-gray-700">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={language === 'fr' ? 'Posez une question sur Cardano...' : 'Uliza swali kuhusu Cardano...'}
                className="flex-1 px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default CardanoChatBot;
