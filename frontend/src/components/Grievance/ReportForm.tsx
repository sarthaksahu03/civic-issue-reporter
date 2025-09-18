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
  const [audioDataUrl, setAudioDataUrl] = useState<string | null>(null);
  const [recording, setRecording] = useState<boolean>(false);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
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
      // Persist to backend with media
      const { apiService } = await import('../../services/api');
      const payload = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        location: formData.address,
        userId: user?.id || '',
        images,
        audio: audioDataUrl || undefined,
        latitude: coords.latitude,
        longitude: coords.longitude,
      };
      const res = await apiService.createGrievanceWithMedia(payload);
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

  // Audio recording helpers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = () => setAudioDataUrl(reader.result as string);
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorder.start();
      setRecorder(mediaRecorder);
      setRecording(true);
    } catch (e) {
      console.error('Audio record error:', e);
      alert('Could not access microphone.');
    }
  };

  const stopRecording = () => {
    if (recorder && recording) {
      recorder.stop();
      setRecording(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-6 md:py-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 md:w-14 md:h-14 bg-primary/10 dark:bg-primary-dark/20 rounded-md flex items-center justify-center">
            <span className="text-2xl text-primary dark:text-primary-dark" aria-hidden="true">📢</span>
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Report a Grievance</h2>
            <p className="text-slate-600 dark:text-slate-300">Provide details to help us resolve the issue quickly.</p>
          </div>
        </div>
      </section>

      {/* Form section */}
      <section className="border-y border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/20">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-2 sm:px-4 lg:px-6 py-6 md:py-10 space-y-6" aria-label="Report grievance form">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">
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
              <label htmlFor="category" className="block text-sm font-medium mb-2">
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
              <label htmlFor="priority" className="block text-sm font-medium mb-2">
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
            <label htmlFor="description" className="block text-sm font-medium mb-2">
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
            <label htmlFor="address" className="block text-sm font-medium mb-2">
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
                className="px-4 py-3 bg-primary text-white rounded-md hover:bg-primary/90 dark:bg-primary-dark dark:hover:bg-primary-dark/90 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Use current location"
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
            <label className="block text-sm font-medium mb-2">
              Photos (Optional)
            </label>
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-md p-6 text-center hover:border-primary transition-colors">
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
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Camera className="h-8 w-8 text-slate-400" />
                <span className="text-sm text-slate-600 dark:text-slate-300">
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
                      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition-colors"
                      aria-label={`Remove image ${index + 1}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Audio Upload/Record */}
          <div>
            <label className="block text-sm font-medium mb-2">Audio Description (Optional)</label>
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                {!recording ? (
                  <button type="button" onClick={startRecording} className="px-3 py-2 rounded-md bg-slate-200 dark:bg-slate-700">Start Recording</button>
                ) : (
                  <button type="button" onClick={stopRecording} className="px-3 py-2 rounded-md bg-red-600 text-white">Stop Recording</button>
                )}
                <label className="px-3 py-2 rounded-md bg-slate-200 dark:bg-slate-700 cursor-pointer">
                  <input type="file" accept="audio/*" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => setAudioDataUrl(reader.result as string);
                      reader.readAsDataURL(file);
                    }
                  }} />
                  Upload Audio
                </label>
              </div>
              {audioDataUrl && (
                <audio controls src={audioDataUrl} className="w-full" />
              )}
            </div>
          </div>
          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-white py-3 rounded-md font-medium hover:bg-primary/90 dark:bg-primary-dark dark:hover:bg-primary-dark/90 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader className="h-5 w-5 animate-spin" />
                  <span>Submitting...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>Submit Grievance</span>
                </div>
              )}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default ReportForm;