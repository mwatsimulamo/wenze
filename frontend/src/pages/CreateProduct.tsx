import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Camera, Upload } from 'lucide-react';

const CreateProduct = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price_ada: '',
    category: 'electronics',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
      // Create a unique file name
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
      alert("Erreur lors de l'upload de l'image. Vérifiez que le bucket 'product-images' existe dans Supabase Storage.");
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      let finalImageUrl = '';

      // Upload Image first if selected
      if (imageFile) {
        const url = await uploadImage(imageFile);
        if (url) finalImageUrl = url;
        else {
            setLoading(false);
            return; // Stop if upload failed
        }
      }

      const { error } = await supabase
        .from('products')
        .insert([
          {
            seller_id: user.id,
            title: formData.title,
            description: formData.description,
            price_ada: parseFloat(formData.price_ada),
            category: formData.category,
            image_url: finalImageUrl, // Use the uploaded URL
            status: 'available'
          }
        ]);

      if (error) throw error;
      navigate('/products');
    } catch (error) {
      console.error('Error creating product:', error);
      alert(`Erreur: ${error.message || error.details || 'Impossible de créer le produit'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-10">
      <h1 className="text-3xl font-bold text-secondary mb-6">Vendre un produit</h1>
      
      <form onSubmit={handleSubmit} className="card space-y-6">
        {/* Image Upload Section */}
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 hover:bg-gray-100 transition cursor-pointer relative">
            <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageChange} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            {previewUrl ? (
                <div className="relative w-full h-64">
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-contain rounded-md" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 opacity-0 hover:opacity-100 transition text-white font-bold">
                        Changer l'image
                    </div>
                </div>
            ) : (
                <div className="text-center text-gray-500">
                    <div className="flex justify-center space-x-4 mb-2">
                        <Camera size={32} />
                        <Upload size={32} />
                    </div>
                    <p className="font-medium">Cliquez pour ajouter une photo</p>
                    <p className="text-xs">ou glissez-déposez ici</p>
                </div>
            )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
          <input 
            type="text" 
            name="title" 
            required
            className="w-full p-2 border rounded-md"
            value={formData.title}
            onChange={handleChange}
            placeholder="Ex: iPhone 13 Pro"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea 
            name="description" 
            required
            rows={4}
            className="w-full p-2 border rounded-md"
            value={formData.description}
            onChange={handleChange}
            placeholder="Décrivez votre produit..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prix (ADA)</label>
            <input 
              type="number" 
              name="price_ada" 
              required
              min="0"
              step="0.1"
              className="w-full p-2 border rounded-md"
              value={formData.price_ada}
              onChange={handleChange}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
            <select 
              name="category" 
              className="w-full p-2 border rounded-md"
              value={formData.category}
              onChange={handleChange}
            >
              <option value="electronics">Électronique</option>
              <option value="fashion">Mode</option>
              <option value="home">Maison</option>
              <option value="digital">Digital</option>
              <option value="other">Autre</option>
            </select>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full btn-primary py-3 text-lg disabled:opacity-50"
        >
          {loading ? 'Publication en cours...' : 'Publier le produit'}
        </button>
      </form>
    </div>
  );
};

export default CreateProduct;
