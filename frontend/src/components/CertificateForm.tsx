import React, { useState, useEffect } from 'react';
import { Plus, Save, X, Tag, FileText, Category, Brain } from 'lucide-react';
import { CertificateData, CreateCertificateRequest, CERTIFICATE_CATEGORIES } from '@/types';
import blockchainService from '@/services/blockchain';
import toast from 'react-hot-toast';

interface CertificateFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingCertificate?: CertificateData | null;
  userAddress: string;
}

const CertificateForm: React.FC<CertificateFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingCertificate,
  userAddress,
}) => {
  const [formData, setFormData] = useState<CreateCertificateRequest>({
    proof_text: '',
    proof_id: '',
    category: 'GENERAL',
    metadata: '',
    ai_tags: [],
  });
  const [loading, setLoading] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (editingCertificate) {
      setFormData({
        proof_text: editingCertificate.proof_text,
        proof_id: editingCertificate.proof_id,
        category: editingCertificate.category,
        metadata: editingCertificate.metadata,
        ai_tags: editingCertificate.ai_tags,
      });
    } else {
      resetForm();
    }
  }, [editingCertificate, isOpen]);

  useEffect(() => {
    // Generate AI suggestions based on content
    if (formData.proof_text.length > 20) {
      generateAiSuggestions(formData.proof_text);
    }
  }, [formData.proof_text]);

  const resetForm = () => {
    setFormData({
      proof_text: '',
      proof_id: '',
      category: 'GENERAL',
      metadata: '',
      ai_tags: [],
    });
    setNewTag('');
    setAiSuggestions([]);
  };

  const generateAiSuggestions = (text: string) => {
    // Simple AI suggestion logic - in production, integrate with MindsDB
    const keywords = text.toLowerCase().split(/\s+/);
    const suggestions: string[] = [];

    if (keywords.some(word => ['course', 'degree', 'diploma', 'education'].includes(word))) {
      suggestions.push('education', 'academic', 'learning');
    }
    if (keywords.some(word => ['work', 'job', 'company', 'project'].includes(word))) {
      suggestions.push('professional', 'career', 'business');
    }
    if (keywords.some(word => ['skill', 'ability', 'competency', 'expertise'].includes(word))) {
      suggestions.push('skills', 'competency', 'expertise');
    }
    if (keywords.some(word => ['certificate', 'certification', 'award', 'achievement'].includes(word))) {
      suggestions.push('achievement', 'recognition', 'award');
    }

    setAiSuggestions([...new Set(suggestions)].slice(0, 5));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (!formData.proof_text.trim() || formData.proof_text.length < 10) {
        throw new Error('Proof text must be at least 10 characters long');
      }
      if (!formData.proof_id.trim() || formData.proof_id.length < 5) {
        throw new Error('Proof ID must be at least 5 characters long');
      }

      const metadata = formData.metadata.trim() || '{}';
      try {
        JSON.parse(metadata);
      } catch {
        throw new Error('Metadata must be valid JSON');
      }

      if (editingCertificate) {
        // Update existing certificate
        const txHash = await blockchainService.updateCertificate({
          proof_id: formData.proof_id,
          new_proof_text: formData.proof_text,
          new_category: formData.category,
          new_metadata: metadata,
          new_ai_tags: formData.ai_tags,
        });
        
        toast.success('Certificate updated successfully!');
        console.log('Update transaction:', txHash);
      } else {
        // Create new certificate
        const txHash = await blockchainService.createCertificate({
          ...formData,
          metadata,
        });
        
        toast.success('Certificate created successfully!');
        console.log('Creation transaction:', txHash);
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Certificate operation error:', error);
      toast.error(error.message || 'Failed to process certificate');
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.ai_tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        ai_tags: [...prev.ai_tags, newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      ai_tags: prev.ai_tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const addSuggestedTag = (suggestion: string) => {
    if (!formData.ai_tags.includes(suggestion)) {
      setFormData(prev => ({
        ...prev,
        ai_tags: [...prev.ai_tags, suggestion],
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <FileText className="mr-2 text-primary-600" />
            {editingCertificate ? 'Edit Certificate' : 'Create New Certificate'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Proof ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Certificate ID *
              </label>
              <input
                type="text"
                value={formData.proof_id}
                onChange={(e) => setFormData(prev => ({ ...prev, proof_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                placeholder="e.g., CERT-2024-001, EDU-BLOCKCHAIN-001"
                required
                minLength={5}
                maxLength={100}
                disabled={!!editingCertificate} // Disable editing ID for existing certificates
              />
              <p className="text-xs text-gray-500 mt-1">
                Unique identifier for this certificate (5-100 characters)
              </p>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Category className="inline w-4 h-4 mr-1" />
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                required
              >
                {CERTIFICATE_CATEGORIES.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0) + category.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Proof Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proof Description *
              </label>
              <textarea
                value={formData.proof_text}
                onChange={(e) => setFormData(prev => ({ ...prev, proof_text: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                placeholder="Detailed description of what this certificate proves..."
                required
                minLength={10}
                maxLength={1000}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.proof_text.length}/1000 characters (minimum 10)
              </p>
            </div>

            {/* AI Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="inline w-4 h-4 mr-1" />
                Tags
              </label>
              
              {/* Current Tags */}
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.ai_tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 bg-primary-100 text-primary-800 text-sm rounded-full"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-primary-600 hover:text-primary-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              
              {/* Add New Tag */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder="Add a tag..."
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* AI Suggestions */}
              {aiSuggestions.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-gray-600 mb-2 flex items-center">
                    <Brain className="w-3 h-3 mr-1" />
                    AI Suggestions:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {aiSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => addSuggestedTag(suggestion)}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                      >
                        + {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Metadata */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Metadata (JSON)
              </label>
              <textarea
                value={formData.metadata}
                onChange={(e) => setFormData(prev => ({ ...prev, metadata: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors font-mono text-sm"
                placeholder='{"issuer": "Organization Name", "date": "2024-01-01", "additional_info": "..."}'
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional additional data in JSON format
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {editingCertificate ? 'Update Certificate' : 'Create Certificate'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CertificateForm;