import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { convertFCToADA, convertADAToFC, formatADA, formatFC, getExchangeRate } from '../utils/currencyConverter';
import { Camera, Upload, ArrowLeft, Package, DollarSign, Tag, FileText, Ruler, Phone, Mail, Footprints, TrendingUp, AlertTriangle } from 'lucide-react';

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const NO_ESCROW_CATEGORIES = ['service', 'real_estate', 'auto'];
  const STANDARD_CATEGORIES = ['electronics', 'fashion', 'food', 'beauty', 'diy', 'service', 'real_estate', 'auto'];
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price_fc: '',
    category: 'electronics',
    fashion_type: '',
    size: '',
    shoe_number: '',
    custom_category: '',
    contact_whatsapp: '',
    contact_email: '',
  });

  // Calculer le prix en ADA en temps réel
  const priceInADA = useMemo(() => {
    if (!formData.price_fc || isNaN(parseFloat(formData.price_fc))) return 0;
    return convertFCToADA(parseFloat(formData.price_fc));
  }, [formData.price_fc]);

  useEffect(() => {
    if (id && user) {
      fetchProduct();
    }
  }, [id, user]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Vérifier que l'utilisateur est le propriétaire
      if (data.seller_id !== user?.id) {
        toast.error('Accès refusé', 'Vous ne pouvez modifier que vos propres produits.');
        navigate('/products');
        return;
      }

      // Déterminer si c'est une catégorie personnalisée
      const isCustomCategory = !STANDARD_CATEGORIES.includes(data.category);
      
      // Utiliser price_fc si disponible (prioritaire), sinon convertir depuis price_ada
      const priceInFC = data.price_fc || (data.price_ada ? convertADAToFC(data.price_ada) : 0);
      
      setFormData({
        title: data.title || '',
        description: data.description || '',
        price_fc: priceInFC > 0 ? priceInFC.toString() : '',
        category: isCustomCategory ? 'other' : data.category || 'electronics',
        fashion_type: data.fashion_type || '',
        size: data.size || '',
        shoe_number: data.shoe_number || '',
        custom_category: isCustomCategory ? data.category : '',
        contact_whatsapp: data.contact_whatsapp || '',
        contact_email: data.contact_email || '',
      });

      if (data.image_url) {
        setPreviewUrl(data.image_url);
      }

      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching product:', error);
      toast.error('Erreur', 'Impossible de charger le produit.');
      navigate('/products');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
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
      if (value === 'habit') {
        newData.shoe_number = '';
      } else if (value === 'soulier') {
        newData.size = '';
      } else {
        newData.size = '';
        newData.shoe_number = '';
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
      toast.error('Erreur d\'upload', 'Impossible de télécharger l\'image.');
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;

    // Validation pour les catégories sans escrow
    if (NO_ESCROW_CATEGORIES.includes(formData.category)) {
      if (!formData.contact_whatsapp && !formData.contact_email) {
        toast.warning('Contact requis', 'Pour cette catégorie, veuillez fournir au moins un moyen de contact.');
        return;
      }
    }

    // Validation pour catégorie personnalisée
    if (formData.category === 'other' && !formData.custom_category.trim()) {
      toast.warning('Catégorie requise', 'Veuillez entrer le nom de votre catégorie personnalisée.');
      return;
    }

    // Validation du prix en FC
    if (!formData.price_fc || parseFloat(formData.price_fc) <= 0) {
      toast.warning('Prix requis', 'Veuillez entrer un prix valide en Francs Congolais.');
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

    setSaving(true);

    try {
      // Garder l'image existante si aucune nouvelle image n'est uploadée
      const { data: existingProduct } = await supabase
        .from('products')
        .select('image_url')
        .eq('id', id)
        .single();

      let finalImageUrl = existingProduct?.image_url || null;

      if (imageFile) {
        const url = await uploadImage(imageFile);
        if (url) finalImageUrl = url;
        else {
          setSaving(false);
          return;
        }
      }

      // Construire la catégorie finale
      const finalCategory = formData.category === 'other' 
        ? formData.custom_category.trim() 
        : formData.category;

      const updateData: any = {
        title: formData.title,
        description: formData.description,
        price_ada: priceInADA, // Prix en ADA au moment de la mise à jour
        category: finalCategory,
      };

      // Ajouter price_fc seulement si la valeur est valide
      // (la colonne pourrait ne pas exister encore si la migration n'a pas été exécutée)
      if (formData.price_fc && !isNaN(parseFloat(formData.price_fc)) && parseFloat(formData.price_fc) > 0) {
        updateData.price_fc = parseFloat(formData.price_fc);
      }

      // Ajouter les champs Mode seulement si applicable
      if (formData.category === 'fashion') {
        if (formData.fashion_type) {
          updateData.fashion_type = formData.fashion_type;
        }
        if (formData.fashion_type === 'habit' && formData.size) {
          updateData.size = formData.size;
        } else {
          updateData.size = null;
        }
        if (formData.fashion_type === 'soulier' && formData.shoe_number) {
          updateData.shoe_number = formData.shoe_number;
        } else {
          updateData.shoe_number = null;
        }
      } else {
        updateData.fashion_type = null;
        updateData.size = null;
        updateData.shoe_number = null;
      }

      // Ajouter les contacts pour les catégories sans escrow
      if (NO_ESCROW_CATEGORIES.includes(formData.category)) {
        updateData.contact_whatsapp = formData.contact_whatsapp || null;
        updateData.contact_email = formData.contact_email || null;
      } else {
        updateData.contact_whatsapp = null;
        updateData.contact_email = null;
      }

      // Mettre à jour l'image seulement si une nouvelle a été uploadée
      if (imageFile && finalImageUrl) {
        updateData.image_url = finalImageUrl;
      }

      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id)
        .eq('seller_id', user.id); // Double sécurité

      if (error) throw error;

      toast.success('Produit modifié !', 'Vos modifications ont été enregistrées.');
      navigate(`/products/${id}`);
    } catch (error: any) {
      console.error('Error updating product:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // Message d'erreur plus détaillé
      let errorMessage = 'Impossible de modifier le produit.';
      
      if (error?.message) {
        if (error.message.includes('column') && (error.message.includes('does not exist') || error.message.includes('n\'existe pas'))) {
          errorMessage = 'La colonne price_fc n\'existe pas encore. Veuillez exécuter la migration SQL: supabase/migrations/add_price_fc_column.sql';
        } else if (error.message.includes('null value') || error.message.includes('violates')) {
          errorMessage = `Erreur de validation: ${error.message}`;
        } else if (error.message.includes('permission') || error.message.includes('policy')) {
          errorMessage = `Erreur de permission: ${error.message}`;
        } else {
          errorMessage = `${error.message}`;
        }
      } else if (error?.error_description) {
        errorMessage = error.error_description;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast.error('Erreur de modification', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-primary mx-auto mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <p className="text-gray-500">Chargement du produit...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-1 sm:px-0">
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
        <Link 
          to={`/products/${id}`} 
          className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-dark">Modifier le produit</h1>
          <p className="text-gray-500 mt-0.5 sm:mt-1 text-sm sm:text-base">Mettez à jour les informations</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Image Upload Section */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <h2 className="font-semibold text-dark flex items-center gap-2 text-sm sm:text-base">
              <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              Photo du produit
            </h2>
          </div>
          
          <div className="p-4 sm:p-6">
            <div className="relative border-2 border-dashed border-gray-200 rounded-xl sm:rounded-2xl p-6 sm:p-8 bg-gray-50 hover:bg-gray-100 hover:border-primary/50 transition-all cursor-pointer group active:bg-gray-200">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageChange} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              
              {previewUrl ? (
                <div className="relative aspect-video max-h-56 sm:max-h-72 mx-auto">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-contain rounded-lg sm:rounded-xl" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition rounded-lg sm:rounded-xl">
                    <span className="text-white font-semibold text-sm sm:text-base">Changer l'image</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 sm:py-8">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary/10 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:bg-primary/20 transition">
                    <Upload className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
                  </div>
                  <p className="font-semibold text-dark mb-1 text-sm sm:text-base">Cliquez pour ajouter une photo</p>
                  <p className="text-xs sm:text-sm text-gray-400">PNG, JPG jusqu'à 10MB</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Product Details */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <h2 className="font-semibold text-dark flex items-center gap-2 text-sm sm:text-base">
              <Package className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              Détails du produit
            </h2>
          </div>
          
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
            <div>
              <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                Titre
              </label>
              <input 
                type="text" 
                name="title" 
                required
                className="w-full px-3 sm:px-4 py-3 sm:py-3.5 bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition outline-none text-sm sm:text-base"
                value={formData.title}
                onChange={handleChange}
                placeholder="Ex: iPhone 13 Pro Max 256GB"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                Description
              </label>
              <textarea 
                name="description" 
                required
                rows={4}
                className="w-full px-3 sm:px-4 py-3 sm:py-3.5 bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition outline-none resize-none text-sm sm:text-base"
                value={formData.description}
                onChange={handleChange}
                placeholder="Décrivez votre produit en détail..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                  <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                  Prix (Francs Congolais)
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    name="price_fc" 
                    required
                    min="0"
                    step="100"
                    className="w-full px-3 sm:px-4 py-3 sm:py-3.5 pr-16 sm:pr-20 bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition outline-none text-sm sm:text-base"
                    value={formData.price_fc}
                    onChange={handleChange}
                    placeholder="0"
                  />
                  <span className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">FC</span>
                </div>
                {/* Affichage de la conversion en temps réel */}
                {formData.price_fc && parseFloat(formData.price_fc) > 0 && (
                  <div className="mt-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        <span className="text-xs text-gray-600">Équivalent en ADA:</span>
                      </div>
                      <span className="text-sm font-bold text-primary">
                        {formatADA(priceInADA)} ADA
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-[10px] text-gray-500">
                        Taux: 1 ADA = {getExchangeRate().toLocaleString('fr-FR')} FC
                      </span>
                      <span className="text-[10px] text-green-600 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                        Temps réel
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2 block">Catégorie</label>
                <select 
                  name="category" 
                  required
                  className="w-full px-3 sm:px-4 py-3 sm:py-3.5 bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition outline-none text-sm sm:text-base appearance-none"
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
            </div>

            {/* Mode - Type et dimensions */}
            {formData.category === 'fashion' && (
              <div className="space-y-4">
                {/* Type de produit Mode */}
                <div>
                  <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                    Type de produit
                  </label>
                  <select 
                    name="fashion_type" 
                    required
                    className="w-full px-3 sm:px-4 py-3 sm:py-3.5 bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition outline-none text-sm sm:text-base appearance-none"
                    value={formData.fashion_type}
                    onChange={handleChange}
                  >
                    <option value="">Sélectionner un type</option>
                    <option value="habit">Habit / Vêtement</option>
                    <option value="soulier">Soulier / Chaussure</option>
                  </select>
                </div>

                {/* Taille - Affiché uniquement pour Habit */}
                {formData.fashion_type === 'habit' && (
                  <div>
                    <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                      <Ruler className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                      Taille
                    </label>
                    <input 
                      type="text" 
                      name="size" 
                      required
                      className="w-full px-3 sm:px-4 py-3 sm:py-3.5 bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition outline-none text-sm sm:text-base"
                      value={formData.size}
                      onChange={handleChange}
                      placeholder="Ex: M, L, XL, 42, etc."
                    />
                  </div>
                )}

                {/* Numéro - Affiché uniquement pour Soulier */}
                {formData.fashion_type === 'soulier' && (
                  <div>
                    <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                      <Footprints className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                      Numéro
                    </label>
                    <input 
                      type="text" 
                      name="shoe_number" 
                      required
                      className="w-full px-3 sm:px-4 py-3 sm:py-3.5 bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition outline-none text-sm sm:text-base"
                      value={formData.shoe_number}
                      onChange={handleChange}
                      placeholder="Ex: 40, 42, 44, etc."
                    />
                  </div>
                )}
              </div>
            )}

            {/* Catégorie personnalisée - Affiché uniquement pour Autres */}
            {formData.category === 'other' && (
              <div>
                <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                  <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                  Nom de votre catégorie
                </label>
                <input 
                  type="text" 
                  name="custom_category" 
                  required
                  className="w-full px-3 sm:px-4 py-3 sm:py-3.5 bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition outline-none text-sm sm:text-base"
                  value={formData.custom_category}
                  onChange={handleChange}
                  placeholder="Ex: Livres, Jouets, Sport..."
                />
              </div>
            )}

            {/* Champs de contact - Affichés pour catégories sans escrow */}
            {NO_ESCROW_CATEGORIES.includes(formData.category) && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl space-y-4">
                <div className="flex items-start gap-2 text-green-700 mb-2">
                  <Phone className="w-4 h-4 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">Informations de contact</p>
                    <p className="text-xs text-green-600">Au moins un moyen de contact est obligatoire.</p>
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                    <Phone className="w-3.5 h-3.5 text-green-500" />
                    Numéro WhatsApp
                  </label>
                  <input 
                    type="tel" 
                    name="contact_whatsapp" 
                    className="w-full px-3 sm:px-4 py-3 bg-white border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition outline-none text-sm sm:text-base"
                    value={formData.contact_whatsapp}
                    onChange={handleChange}
                    placeholder="+243 XXX XXX XXX"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                    <Mail className="w-3.5 h-3.5 text-blue-500" />
                    Adresse Email
                  </label>
                  <input 
                    type="email" 
                    name="contact_email" 
                    className="w-full px-3 sm:px-4 py-3 bg-white border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition outline-none text-sm sm:text-base"
                    value={formData.contact_email}
                    onChange={handleChange}
                    placeholder="votre@email.com"
                  />
                </div>

                <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Cette catégorie n'utilise pas l'escrow. Les acheteurs vous contacteront directement.</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <button 
          type="submit" 
          disabled={saving}
          className="w-full bg-gradient-to-r from-primary to-blue-600 text-white font-semibold py-3.5 sm:py-4 px-6 rounded-xl hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          {saving ? (
            <>
              <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Enregistrement...
            </>
          ) : (
            'Enregistrer les modifications'
          )}
        </button>
      </form>
    </div>
  );
};

export default EditProduct;

