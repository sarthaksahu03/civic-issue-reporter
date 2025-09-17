import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Camera, 
  MapPin, 
  X,
  CheckCircle,
  Loader
} from 'lucide-react';

const ReportForm: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'others',
    priority: 'medium',
    address: '',
  });
  
  const [images, setImages] = useState<string[]>([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [coords, setCoords] = useState<{ latitude?: number; longitude?: number }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { value: 'garbage', label: 'Garbage Collection', icon: '🗑️' },
    { value: 'streetlight', label: 'Street Light', icon: '💡' },
    { value: 'water', label: 'Water Supply', icon: '💧' },
    { value: 'road', label: 'Road Maintenance', icon: '🛣️' },
    { value: 'noise', label: 'Noise Pollution', icon: '🔊' },
    { value: 'others', label: 'Others', icon: '📋' },
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'emergency', label: 'Emergency', color: 'bg-red-100 text-red-800' },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImages(prev => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const getCurrentLocation = () => {
    setIsLoadingLocation(true);
    
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      setIsLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Capture high-precision coordinates and store as "lat, lon"
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setCoords({ latitude: lat, longitude: lon });
        const precise = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
        setFormData(prev => ({ ...prev, address: precise }));
        setIsLoadingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to get your location. Please enter address manually.');
        setIsLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim() || !formData.address.trim()) {
      alert('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Persist to backend
      const { apiService } = await import('../../services/api');
      const payload = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        location: formData.address,
        userId: user?.id || '',
        latitude: coords.latitude,
        longitude: coords.longitude,
      };
      const res = await apiService.createGrievance(payload);
      if (!res.success) {
        throw new Error((res as any).error || 'Failed to create grievance');
      }
      alert('Grievance reported successfully!');
      navigate('/my-complaints');
    } catch (error) {
      console.error('Error submitting grievance:', error);
      alert('Error submitting grievance. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-lg bg-surface dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-md shadow p-8 space-y-6" aria-label="Report grievance form">
        <div className="flex flex-col items-center mb-4">
          <div className="w-14 h-14 bg-primary/10 dark:bg-primary-dark/20 rounded-md flex items-center justify-center mb-2">
            <span className="text-2xl text-primary dark:text-primary-dark" aria-hidden="true">📢</span>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Report a Grievance</h2>
        </div>
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Issue Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="w-full"
            placeholder="Brief description of the issue"
            required
          />
        </div>
        {/* Category and Priority */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full"
              required
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.icon} {category.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
              Priority Level *
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              className="w-full"
              required
            >
              {priorities.map(priority => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Detailed Description *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            className="w-full"
            placeholder="Provide detailed information about the issue..."
            required
          />
        </div>
        {/* Location */}
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
            Location *
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className="flex-1"
              placeholder="Enter the address or location"
              required
            />
            <button
              type="button"
              onClick={getCurrentLocation}
              disabled={isLoadingLocation}
              className="px-4 py-3 bg-primary text-white rounded-md hover:bg-primary/90 dark:bg-primary-dark dark:hover:bg-primary-dark/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoadingLocation ? (
                <Loader className="h-5 w-5 animate-spin" />
              ) : (
                <MapPin className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Photos (Optional)
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center hover:border-primary transition-colors">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="cursor-pointer flex flex-col items-center space-y-2"
            >
              <Camera className="h-8 w-8 text-gray-400" />
              <span className="text-sm text-gray-600">
                Click to upload photos of the issue
              </span>
            </label>
          </div>
          {images.length > 0 && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
              {images.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={image}
                    alt={`Issue ${index + 1}`}
                    className="w-full h-32 object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Submit Button */}
        <div className="pt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary text-white py-4 rounded-md font-medium hover:bg-primary/90 dark:bg-primary-dark dark:hover:bg-primary-dark/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center space-x-2">
                <Loader className="h-5 w-5 animate-spin" />
                <span>Submitting...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="h-5 w-5" />
                <span>Submit Grievance</span>
              </div>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReportForm;