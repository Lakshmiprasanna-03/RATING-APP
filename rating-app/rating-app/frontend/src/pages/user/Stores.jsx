import React, { useState, useEffect } from 'react';
import { StarIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import Layout from '../../components/Layout';
import Modal from '../../components/Modal';
import storeService from '../../services/storeService';
import ratingService from '../../services/ratingService';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { validationSchemas } from '../../utils/validationSchemas';
import Button from '../../components/Button';

const Stores = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('ASC');
  const [selectedStore, setSelectedStore] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchemas.rating),
    defaultValues: {
      rating: 5,
    },
  });

  useEffect(() => {
    fetchStores();
  }, [searchTerm, sortBy, sortOrder]);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const data = await storeService.getStores(searchTerm, sortBy, sortOrder);
      setStores(data);
    } catch (error) {
      toast.error('Failed to load stores');
    } finally {
      setLoading(false);
    }
  };

  const handleRateStore = (store) => {
    setSelectedStore(store);
    reset({
      rating: 5,
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data) => {
    if (!selectedStore) return;
    
    setIsSubmitting(true);
    try {
      await ratingService.submitRating(selectedStore.id, data.rating);
      toast.success('Rating submitted successfully');
      setIsModalOpen(false);
      fetchStores();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSortChange = (e) => {
    const value = e.target.value;
    if (value === 'name_asc') {
      setSortBy('name');
      setSortOrder('ASC');
    } else if (value === 'name_desc') {
      setSortBy('name');
      setSortOrder('DESC');
    } else if (value === 'rating_asc') {
      setSortBy('averageRating');
      setSortOrder('ASC');
    } else if (value === 'rating_desc') {
      setSortBy('averageRating');
      setSortOrder('DESC');
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
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Stores</h1>
            <p className="mt-2 text-sm text-gray-700">
              Browse and rate your favorite stores
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="max-w-sm w-full">
            <label htmlFor="search" className="sr-only">
              Search
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <MagnifyingGlassIcon
                  className="h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
              </div>
              <input
                id="search"
                name="search"
                className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-blue-500 focus:text-gray-900 focus:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                placeholder="Search by name or address"
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div>
            <select
              id="sort"
              name="sort"
              className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              defaultValue="name_asc"
              onChange={handleSortChange}
            >
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
              <option value="rating_desc">Rating (High to Low)</option>
              <option value="rating_asc">Rating (Low to High)</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
          </div>
        ) : stores.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500">No stores found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {stores.map((store) => (
              <div
                key={store.id}
                className="bg-white overflow-hidden shadow rounded-lg"
              >
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 truncate">
                    {store.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 h-12 overflow-hidden">
                    {store.address}
                  </p>
                  <div className="mt-4 flex items-center">
                    {renderRatingStars(Math.round(store.averageRating))}
                    <span className="ml-2 text-sm text-gray-500">
                      {store.averageRating ? store.averageRating.toFixed(1) : 'No ratings'} ({store.totalRatings})
                    </span>
                  </div>
                  <div className="mt-5">
                    <Button
                      onClick={() => handleRateStore(store)}
                      className="w-full flex items-center justify-center"
                    >
                      <StarIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                      Rate this store
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`Rate ${selectedStore?.name}`}
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
                Submit
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

export default Stores;
