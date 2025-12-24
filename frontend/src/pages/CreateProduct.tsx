import React, { useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { convertFCToADA, formatADA, formatFC, getExchangeRate } from '../utils/currencyConverter';
import { Camera, Upload, ArrowLeft, Package, DollarSign, Tag, FileText, Ruler, Phone, Mail, Shirt, Footprints, TrendingUp, AlertTriangle, CheckCircle, X, Minus, Plus } from 'lucide-react';

const CreateProduct = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const NO_ESCROW_CATEGORIES = ['service', 'real_estate', 'auto'];
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price_fc: '',
    price_type: 'fixed', // 'fixed' or 'negotiable'
    price_min: '',
    price_max: '',
    category: 'electronics',
    condition: 'new', // 'new' or 'used'
    fashion_type: '',
    size: '',
    shoe_number: '',
    custom_category: '',
    contact_whatsapp: '',
    contact_email: '',
    is_available: true, // For services only
  });

  // Calculer le prix en ADA en temps réel
  const priceInADA = useMemo(() => {
    if (formData.price_type === 'fixed' && formData.price_fc && !isNaN(parseFloat(formData.price_fc))) {
      return convertFCToADA(parseFloat(formData.price_fc));
    } else if (formData.price_type === 'negotiable' && formData.price_min && formData.price_max) {
      const avgPrice = (parseFloat(formData.price_min) + parseFloat(formData.price_max)) / 2;
      return convertFCToADA(avgPrice);
    }
    return 0;
  }, [formData.price_fc, formData.price_type, formData.price_min, formData.price_max]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Réinitialiser les champs selon les changements
    if (name === 'category') {
      const newData: any = { ...formData, [name]: value };
      if (value !== 'fashion') {
        newData.fashion_type = '';
        newData.size = '';
        newData.shoe_number = '';
      }
      if (value !== 'other') {
        newData.custom_category = '';
      }
      if (!NO_ESCROW_CATEGORIES.includes(value)) {
        newData.contact_whatsapp = '';
        newData.contact_email = '';
      }
      setFormData(newData);
    } else if (name === 'fashion_type') {
      const newData: any = { ...formData, [name]: value };
      // Réinitialiser taille et numéro selon le type
      if (value === 'habit') {
        newData.shoe_number = '';
      } else if (value === 'soulier') {
        newData.size = '';
      } else {
        newData.size = '';
        newData.shoe_number = '';
      }
      setFormData(newData);
    } else if (name === 'price_type') {
      // Réinitialiser les champs de prix selon le type
      const newData: any = { ...formData, [name]: value };
      if (value === 'fixed') {
        newData.price_min = '';
        newData.price_max = '';
      } else if (value === 'negotiable') {
        newData.price_fc = '';
      }
      setFormData(newData);
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Erreur d\'upload', 'Impossible de télécharger l\'image. Réessayez.');
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validation du prix selon le type
    if (formData.price_type === 'fixed') {
      if (!formData.price_fc || parseFloat(formData.price_fc) <= 0) {
        toast.warning('Prix requis', 'Veuillez entrer un prix valide en Francs Congolais.');
        return;
      }
    } else if (formData.price_type === 'negotiable') {
      if (!formData.price_min || !formData.price_max || parseFloat(formData.price_min) <= 0 || parseFloat(formData.price_max) <= 0) {
        toast.warning('Prix requis', 'Veuillez entrer des limites de prix valides (minimum et maximum).');
        return;
      }
      if (parseFloat(formData.price_min) >= parseFloat(formData.price_max)) {
        toast.warning('Prix invalide', 'Le prix minimum doit être inférieur au prix maximum.');
        return;
      }
    }

    // Validation pour les catégories sans escrow
    if (NO_ESCROW_CATEGORIES.includes(formData.category)) {
      if (!formData.contact_whatsapp && !formData.contact_email) {
        toast.warning('Contact requis', 'Pour cette catégorie, veuillez fournir au moins un moyen de contact (WhatsApp ou Email).');
        return;
      }
    }

    // Validation pour catégorie personnalisée
    if (formData.category === 'other' && !formData.custom_category.trim()) {
      toast.warning('Catégorie requise', 'Veuillez entrer le nom de votre catégorie personnalisée.');
      return;
    }

    // Validation pour Mode
    if (formData.category === 'fashion') {
      if (!formData.fashion_type) {
        toast.warning('Type requis', 'Veuillez sélectionner le type de produit (Habit ou Soulier).');
        return;
      }
      if (formData.fashion_type === 'habit' && !formData.size) {
        toast.warning('Taille requise', 'Veuillez sélectionner une taille pour l\'habit.');
        return;
      }
      if (formData.fashion_type === 'soulier' && !formData.shoe_number) {
        toast.warning('Numéro requis', 'Veuillez sélectionner un numéro pour le soulier.');
        return;
      }
    }

    setLoading(true);

    try {
      let finalImageUrl = '';

      if (imageFile) {
        const url = await uploadImage(imageFile);
        if (url) finalImageUrl = url;
        else {
          setLoading(false);
          return;
        }
      }

      // Construire la catégorie finale (avec custom_category si applicable)
      const finalCategory = formData.category === 'other' 
        ? formData.custom_category.trim() 
        : formData.category;

      // Construire l'objet de données de manière propre
      // price_fc est la valeur fixe, price_ada sera calculé à l'affichage selon le taux actuel
      const productData: any = {
        seller_id: user.id,
        title: formData.title,
        description: formData.description,
        price_type: formData.price_type,
        category: finalCategory,
        status: 'available',
      };

      // Ajouter les prix selon le type
      if (formData.price_type === 'fixed') {
        productData.price_fc = parseFloat(formData.price_fc);
        productData.price_ada = priceInADA;
      } else if (formData.price_type === 'negotiable') {
        productData.price_min = parseFloat(formData.price_min);
        productData.price_max = parseFloat(formData.price_max);
        // Pour l'affichage, on prend le prix moyen comme référence
        const avgPrice = (parseFloat(formData.price_min) + parseFloat(formData.price_max)) / 2;
        productData.price_fc = avgPrice;
        productData.price_ada = convertFCToADA(avgPrice);
      }

      // Ajouter la condition du produit (nouveau/occasion) - seulement pour les produits (pas les services)
      if (formData.category !== 'service') {
        productData.condition = formData.condition;
      }

      // Ajouter la disponibilité pour les services
      if (formData.category === 'service') {
        productData.is_available = formData.is_available;
      }

      // Ajouter l'image si elle existe
      if (finalImageUrl) {
        productData.image_url = finalImageUrl;
      }

      // Ajouter les champs Mode si applicable (uniquement si valeurs présentes et non vides)
      if (formData.category === 'fashion') {
        if (formData.fashion_type && formData.fashion_type.trim()) {
          productData.fashion_type = formData.fashion_type.trim();
        }
        if (formData.fashion_type === 'habit' && formData.size && formData.size.trim()) {
          productData.size = formData.size.trim();
        }
        if (formData.fashion_type === 'soulier' && formData.shoe_number && formData.shoe_number.trim()) {
          productData.shoe_number = formData.shoe_number.trim();
        }
      } else {
        // S'assurer que les champs Mode ne sont pas inclus pour les autres catégories
        // (ne pas les envoyer du tout si la catégorie n'est pas fashion)
      }

      // Ajouter les contacts pour les catégories sans escrow
      if (NO_ESCROW_CATEGORIES.includes(formData.category)) {
        if (formData.contact_whatsapp?.trim()) {
          productData.contact_whatsapp = formData.contact_whatsapp.trim();
        }
        if (formData.contact_email?.trim()) {
          productData.contact_email = formData.contact_email.trim();
        }
      }

      const { error, data } = await supabase
        .from('products')
        .insert([productData])
        .select();

      if (error) {
        console.error('Supabase error details:', error);
        // Vérifier si l'erreur est liée aux colonnes manquantes
        if (error.message?.includes('column') || error.message?.includes('does not exist') || error.message?.includes('n\'existe pas')) {
          const missingColumns: string[] = [];
          if (error.message?.includes('fashion_type')) missingColumns.push('fashion_type');
          if (error.message?.includes('shoe_number')) missingColumns.push('shoe_number');
          if (error.message?.includes('size')) missingColumns.push('size');
          if (error.message?.includes('condition')) missingColumns.push('condition');
          if (error.message?.includes('price_fc')) missingColumns.push('price_fc');
          if (error.message?.includes('price_type')) missingColumns.push('price_type');
          if (error.message?.includes('price_min')) missingColumns.push('price_min');
          if (error.message?.includes('price_max')) missingColumns.push('price_max');
          if (error.message?.includes('contact_whatsapp')) missingColumns.push('contact_whatsapp');
          if (error.message?.includes('contact_email')) missingColumns.push('contact_email');
          if (error.message?.includes('is_available')) missingColumns.push('is_available');
          
          const columnsMsg = missingColumns.length > 0 
            ? `Colonnes manquantes: ${missingColumns.join(', ')}. `
            : '';
          
          throw new Error(
            `Erreur de base de données: ${columnsMsg}` +
            'Veuillez exécuter la migration SQL consolidée: supabase/migrations/01_consolidate_all_product_columns.sql ' +
            'dans l\'éditeur SQL de Supabase. Cette migration ajoute toutes les colonnes nécessaires.'
          );
        }
        throw error;
      }
      
      toast.success('Produit publié !', 'Votre annonce est maintenant visible sur le marché.');
      navigate('/products');
    } catch (error: any) {
      console.error('Error creating product:', error);
      const errorMessage = error.message || 'Impossible de créer le produit. Réessayez.';
      toast.error('Erreur de publication', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
      {/* Header - Compact */}
      <div className="flex items-center gap-3 mb-6">
        <Link 
          to="/products" 
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-dark dark:text-white">Publier une annonce</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Vendez un produit ou proposez un service</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Image Upload Section - Compact */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-dark dark:text-white flex items-center gap-2 text-sm">
              <Camera className="w-4 h-4 text-primary" />
              {formData.category === 'service' ? 'Photo/Illustration' : 'Photo du produit'}
            </h2>
          </div>
          
          <div className="p-4">
            <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900 hover:border-primary/50 transition-all cursor-pointer group active:scale-[0.98]">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageChange} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              
              {previewUrl ? (
                <div className="relative aspect-video max-h-48 mx-auto">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-contain rounded-lg" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition rounded-lg">
                    <span className="text-white font-semibold text-sm">Changer l'image</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 dark:group-hover:bg-primary/30 transition">
                    <Upload className="w-6 h-6 text-primary" />
                  </div>
                  <p className="font-semibold text-dark dark:text-white mb-1 text-sm">Cliquez pour ajouter une photo</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG jusqu'à 10MB</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Product Details - Compact avec layout 2 colonnes */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-dark dark:text-white flex items-center gap-2 text-sm">
              <Package className="w-4 h-4 text-primary" />
              {formData.category === 'service' ? 'Détails du service' : 'Détails du produit'}
            </h2>
          </div>
          
          <div className="p-4 space-y-4">
            {/* Catégorie et Condition - Layout 2 colonnes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  <Tag className="w-3.5 h-3.5 text-gray-400" />
                  Catégorie
                </label>
                <select 
                  name="category" 
                  required
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white dark:focus:bg-gray-800 transition outline-none text-sm appearance-none"
                  value={formData.category}
                  onChange={handleChange}
                >
                <option value="electronics">Électronique</option>
                <option value="fashion">Mode</option>
                <option value="food">Aliments</option>
                <option value="beauty">Beauté & Hygiène</option>
                <option value="diy">Bricolage & Matériaux</option>
                <option value="service">Services</option>
                <option value="real_estate">Immobilier</option>
                <option value="auto">Auto & Moto</option>
                <option value="other">Autres</option>
                </select>
              </div>

              {/* Condition (nouveau/occasion) - seulement pour les produits (pas les services) */}
              {formData.category !== 'service' && (
                <div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    <Package className="w-3.5 h-3.5 text-gray-400" />
                    État du produit
                  </label>
                  <select 
                    name="condition" 
                    required
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white dark:focus:bg-gray-800 transition outline-none text-sm appearance-none"
                    value={formData.condition}
                    onChange={handleChange}
                  >
                    <option value="new">Nouveau</option>
                    <option value="used">Occasion</option>
                  </select>
                </div>
              )}
            </div>

            {/* Titre - Pleine largeur */}
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                <Tag className="w-3.5 h-3.5 text-gray-400" />
                Titre
              </label>
              <input 
                type="text" 
                name="title" 
                required
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white dark:focus:bg-gray-800 transition outline-none text-sm"
                value={formData.title}
                onChange={handleChange}
                placeholder={
                  formData.category === 'electronics' ? 'Ex: iPhone 13 Pro Max 256GB, Samsung Galaxy S21, MacBook Pro...' :
                  formData.category === 'fashion' ? 'Ex: Chemise élégante taille M, Chaussures Nike Air Max 42...' :
                  formData.category === 'food' ? 'Ex: Riz local 25kg, Huile de palme 5L, Fruits frais...' :
                  formData.category === 'beauty' ? 'Ex: Crème hydratante, Parfum Chanel, Kit maquillage complet...' :
                  formData.category === 'diy' ? 'Ex: Ciment 50kg, Tôle ondulée, Peinture blanche...' :
                  formData.category === 'service' ? 'Ex: Réparation smartphone, Cours de français, Plomberie...' :
                  formData.category === 'real_estate' ? 'Ex: Appartement 2 chambres, Terrain à bâtir 500m²...' :
                  formData.category === 'auto' ? 'Ex: Toyota Corolla 2018, Moto Yamaha, Pièces détachées...' :
                  'Ex: Entrez le titre de votre annonce...'
                }
              />
            </div>

            {/* Description - Compact */}
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                <FileText className="w-3.5 h-3.5 text-gray-400" />
                Description
              </label>
              <textarea 
                name="description" 
                required
                rows={3}
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white dark:focus:bg-gray-800 transition outline-none resize-none text-sm"
                value={formData.description}
                onChange={handleChange}
                placeholder={
                  formData.category === 'electronics' ? 'Décrivez votre produit : modèle, état (neuf/occasion), accessoires inclus, garantie, fonctionnalités...' :
                  formData.category === 'fashion' ? 'Décrivez votre article : matière, couleur, taille disponible, état, marque, style...' :
                  formData.category === 'food' ? 'Décrivez votre produit : origine, qualité, quantité disponible, fraîcheur, conditionnement, date d\'expiration...' :
                  formData.category === 'beauty' ? 'Décrivez votre produit : type, marque, quantité, date de péremption, état, avantages...' :
                  formData.category === 'diy' ? 'Décrivez votre matériau : type, qualité, quantité disponible, état, utilisation recommandée...' :
                  formData.category === 'service' ? 'Décrivez votre service : compétences, expérience, durée estimée, zone de service, tarifs, disponibilité...' :
                  formData.category === 'real_estate' ? 'Décrivez votre bien : localisation précise, superficie, nombre de pièces, équipements, état, charges, documents disponibles...' :
                  formData.category === 'auto' ? 'Décrivez votre véhicule ou pièce : marque, modèle, année, kilométrage, état, documents disponibles (carte grise, assurance), équipements...' :
                  'Décrivez votre produit en détail...'
                }
              />
            </div>

            {/* Prix - Type et montant en 2 colonnes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                  Type de prix
                </label>
                <select 
                  name="price_type" 
                  required
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white dark:focus:bg-gray-800 transition outline-none text-sm appearance-none"
                  value={formData.price_type}
                  onChange={handleChange}
                >
                  <option value="fixed">Prix fixe</option>
                  <option value="negotiable">Prix négociable</option>
                </select>
              </div>

              {/* Prix fixe */}
              {formData.price_type === 'fixed' && (
                <div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                    {formData.category === 'service' ? 'Tarif (FC)' : 'Prix (FC)'}
                  </label>
                  <div className="relative">
                    <input 
                      type="number" 
                      name="price_fc" 
                      required={formData.price_type === 'fixed'}
                      min="0"
                      step="100"
                      className="w-full px-3 py-2.5 pr-12 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white dark:focus:bg-gray-800 transition outline-none text-sm"
                      value={formData.price_fc}
                      onChange={handleChange}
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-xs">FC</span>
                  </div>
                </div>
              )}
            </div>

            {/* Conversion ADA - Compact */}
            {formData.price_type === 'fixed' && formData.price_fc && parseFloat(formData.price_fc) > 0 && (
              <div className="p-2.5 bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/30 rounded-lg">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-primary" />
                    <span className="text-gray-600 dark:text-gray-300">≈ {formatADA(priceInADA)} ADA</span>
                  </div>
                  <span className="text-[10px] text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    Temps réel
                  </span>
                </div>
              </div>
            )}

            {/* Prix négociable - Layout 2 colonnes */}
            {formData.price_type === 'negotiable' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    <Minus className="w-3.5 h-3.5 text-gray-400" />
                    Prix minimum (FC)
                  </label>
                  <div className="relative">
                    <input 
                      type="number" 
                      name="price_min" 
                      required={formData.price_type === 'negotiable'}
                      min="0"
                      step="100"
                      className="w-full px-3 py-2.5 pr-12 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white dark:focus:bg-gray-800 transition outline-none text-sm"
                      value={formData.price_min}
                      onChange={handleChange}
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-xs">FC</span>
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    <Plus className="w-3.5 h-3.5 text-gray-400" />
                    Prix maximum (FC)
                  </label>
                  <div className="relative">
                    <input 
                      type="number" 
                      name="price_max" 
                      required={formData.price_type === 'negotiable'}
                      min="0"
                      step="100"
                      className="w-full px-3 py-2.5 pr-12 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white dark:focus:bg-gray-800 transition outline-none text-sm"
                      value={formData.price_max}
                      onChange={handleChange}
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-xs">FC</span>
                  </div>
                </div>
              </div>
            )}
            {formData.price_type === 'negotiable' && formData.price_min && formData.price_max && parseFloat(formData.price_min) >= parseFloat(formData.price_max) && (
              <div className="p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Le prix minimum doit être inférieur au prix maximum
                </p>
              </div>
            )}

            {/* Disponibilité pour les services - Compact */}
            {formData.category === 'service' && (
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-gray-400" />
                  Disponibilité
                </label>
                <select 
                  name="is_available" 
                  required
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white dark:focus:bg-gray-800 transition outline-none text-sm appearance-none"
                  value={formData.is_available ? 'true' : 'false'}
                  onChange={(e) => setFormData({ ...formData, is_available: e.target.value === 'true' })}
                >
                  <option value="true">Disponible</option>
                  <option value="false">Indisponible</option>
                </select>
              </div>
            )}

            {/* Mode - Type et dimensions - Layout 2 colonnes */}
            {formData.category === 'fashion' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    <Tag className="w-3.5 h-3.5 text-gray-400" />
                    Type de produit
                  </label>
                  <select 
                    name="fashion_type" 
                    required
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white dark:focus:bg-gray-800 transition outline-none text-sm appearance-none"
                    value={formData.fashion_type}
                    onChange={handleChange}
                  >
                    <option value="">Sélectionner un type</option>
                    <option value="habit">Habit / Vêtement</option>
                    <option value="soulier">Soulier / Chaussure</option>
                  </select>
                </div>

                {/* Taille ou Numéro selon le type */}
                {formData.fashion_type === 'habit' && (
                  <div>
                    <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      <Ruler className="w-3.5 h-3.5 text-gray-400" />
                      Taille
                    </label>
                    <input 
                      type="text" 
                      name="size" 
                      required
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white dark:focus:bg-gray-800 transition outline-none text-sm"
                      value={formData.size}
                      onChange={handleChange}
                      placeholder="Ex: M, L, XL, 42"
                    />
                  </div>
                )}

                {formData.fashion_type === 'soulier' && (
                  <div>
                    <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      <Footprints className="w-3.5 h-3.5 text-gray-400" />
                      Numéro
                    </label>
                    <input 
                      type="text" 
                      name="shoe_number" 
                      required
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white dark:focus:bg-gray-800 transition outline-none text-sm"
                      value={formData.shoe_number}
                      onChange={handleChange}
                      placeholder="Ex: 40, 42, 44"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Catégorie personnalisée - Affiché uniquement pour Autres */}
            {formData.category === 'other' && (
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  <Tag className="w-3.5 h-3.5 text-gray-400" />
                  Nom de votre catégorie
                </label>
                <input 
                  type="text" 
                  name="custom_category" 
                  required
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white dark:focus:bg-gray-800 transition outline-none text-sm"
                  value={formData.custom_category}
                  onChange={handleChange}
                  placeholder="Ex: Livres, Jouets, Sport..."
                />
              </div>
            )}

            {/* Champs de contact - Compact avec layout 2 colonnes */}
            {NO_ESCROW_CATEGORIES.includes(formData.category) && (
              <div className="p-3.5 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg space-y-3">
                <div className="flex items-start gap-2 text-green-700 dark:text-green-400">
                  <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-xs">Informations de contact</p>
                    <p className="text-[10px] text-green-600 dark:text-green-500 mt-0.5">Au moins un moyen de contact est obligatoire</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      <Phone className="w-3 h-3 text-green-500" />
                      WhatsApp
                    </label>
                    <input 
                      type="tel" 
                      name="contact_whatsapp" 
                      className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition outline-none text-sm"
                      value={formData.contact_whatsapp}
                      onChange={handleChange}
                      placeholder="+243 XXX XXX XXX"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      <Mail className="w-3 h-3 text-blue-500" />
                      Email
                    </label>
                    <input 
                      type="email" 
                      name="contact_email" 
                      className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition outline-none text-sm"
                      value={formData.contact_email}
                      onChange={handleChange}
                      placeholder="votre@email.com"
                    />
                  </div>
                </div>

                <p className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-2 rounded-lg flex items-start gap-1.5">
                  <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                  <span>Cette catégorie n'utilise pas l'escrow. Les acheteurs vous contacteront directement.</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button - Compact */}
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-gradient-to-r from-primary to-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Publication en cours...
            </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                {formData.category === 'service' ? 'Publier le service' : 'Publier le produit'}
              </>
            )}
        </button>
      </form>
    </div>
  );
};

export default CreateProduct;
