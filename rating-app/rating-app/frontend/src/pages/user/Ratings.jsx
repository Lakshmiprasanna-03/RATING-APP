import React, { useState, useEffect } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import Layout from '../../components/Layout';
import Modal from '../../components/Modal';
import ratingService from '../../services/ratingService';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { validationSchemas } from '../../utils/validationSchemas';
import Button from '../../components/Button';

const Ratings = () => {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRating, setSelectedRating] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchemas.rating),
  });

  useEffect(() => {
    fetchRatings();
  }, []);

  const fetchRatings = async () => {
    try {
      setLoading(true);
      const data = await ratingService.getUserRatings();
      setRatings(data.ratings || []);
    } catch (error) {
      toast.error('Failed to load ratings');
    } finally {
      setLoading(false);
    }
  };

  const handleEditRating = (rating) => {
    setSelectedRating(rating);
    reset({
      rating: rating.rating,
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data) => {
    if (!selectedRating) return;
    
    setIsSubmitting(true);
    try {
      await ratingService.submitRating(selectedRating.store.id, data.rating);
      toast.success('Rating updated successfully');
      setIsModalOpen(false);
      fetchRatings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderRatingStars = (rating) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <StarIcon
            key={i}
            className={`h-5 w-5 ${
              i < rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">My Ratings</h1>
          <p className="mt-2 text-sm text-gray-700">
            View and manage your store ratings
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
          </div>
        ) : ratings.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500">You haven't rated any stores yet</p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <ul className="divide-y divide-gray-200">
              {ratings.map((rating) => (
                <li key={rating.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {rating.store.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {rating.store.address}
                      </p>
                      <div className="mt-2 flex items-center">
                        {renderRatingStars(rating.rating)}
                        <span className="ml-2 text-sm text-gray-500">
                          Rated on {new Date(rating.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleEditRating(rating)}
                      variant="secondary"
                      size="sm"
                    >
                      Edit Rating
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`Update Rating for ${selectedRating?.store.name}`}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label
                htmlFor="rating"
                className="block text-sm font-medium text-gray-700"
              >
                Rating
              </label>
              <div className="mt-2">
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <label key={value} className="cursor-pointer">
                      <input
                        type="radio"
                        value={value}
                        {...register('rating')}
                        className="sr-only"
                      />
                      <StarIcon
                        className={`h-8 w-8 ${
                          value <= parseInt(register('rating').value)
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        } hover:text-yellow-400`}
                      />
                    </label>
                  ))}
                </div>
                {errors.rating && (
                  <p className="mt-1 text-sm text-red-600">{errors.rating.message}</p>
                )}
              </div>
            </div>

            <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
              <Button
                type="submit"
                isLoading={isSubmitting}
                className="w-full sm:col-start-2"
              >
                Update
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsModalOpen(false)}
                className="mt-3 w-full sm:col-start-1 sm:mt-0"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
};

export default Ratings;
