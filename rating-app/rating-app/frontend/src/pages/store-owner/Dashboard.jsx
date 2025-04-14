import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Layout from '../../components/Layout';
import storeService from '../../services/storeService';
import ratingService from '../../services/ratingService';
import { StarIcon } from '@heroicons/react/24/solid';
import { PencilIcon, PlusIcon } from '@heroicons/react/24/outline';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { validationSchemas } from '../../utils/validationSchemas';

const Dashboard = () => {
  const [store, setStore] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchemas.store),
  });

  useEffect(() => {
    fetchStoreData();
  }, []);

  const fetchStoreData = async () => {
    try {
      setLoading(true);

      try {
        // Get store details - this might fail if the store owner doesn't have a store yet
        const storeData = await storeService.getMyStore();
        setStore(storeData);

        // Only try to get ratings if we successfully got a store
        const ratingsData = await ratingService.getStoreOwnerRatings();
        if (ratingsData.stores && ratingsData.stores.length > 0) {
          setRatings(ratingsData.stores[0].ratings || []);
        }
      } catch (storeError) {
        // If the error is a 404 (store not found), this is expected for new store owners
        if (storeError.response && storeError.response.status === 404) {
          // This is fine, the user just doesn't have a store yet
          setStore(null);
          setRatings([]);
        } else {
          // For other errors, show the error message
          console.error('Store fetch error:', storeError);
          toast.error('Failed to fetch store data');
        }
      }
    } catch (error) {
      console.error('Dashboard error:', error);
      toast.error('An error occurred while loading the dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleEditStore = () => {
    if (store) {
      reset({
        name: store.name,
        address: store.address,
      });
      setIsEditModalOpen(true);
    }
  };

  const handleCreateStore = () => {
    reset({
      name: '',
      address: '',
    });
    setIsCreateModalOpen(true);
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      if (store) {
        // Update existing store
        await storeService.updateStore(store.id, data);
        toast.success('Store updated successfully');
        setIsEditModalOpen(false);
      } else {
        // Create new store
        await storeService.createStore(data);
        toast.success('Store created successfully');
        setIsCreateModalOpen(false);
      }
      fetchStoreData();
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${store ? 'update' : 'create'} store`);
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
      <div className="space-y-8">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
          </div>
        ) : !store ? (
          <div className="text-center py-10">
            <h2 className="text-xl font-medium text-gray-900">
              You don't have a store yet
            </h2>
            <p className="mt-2 text-sm text-gray-500 mb-6">
              Create your store to start receiving ratings.
            </p>
            <Button
              onClick={handleCreateStore}
              className="inline-flex items-center"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Create Store
            </Button>
          </div>
        ) : (
          <>
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Store Information
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Details about your store
                  </p>
                </div>
                <Button
                  onClick={handleEditStore}
                  variant="secondary"
                  className="inline-flex items-center"
                >
                  <PencilIcon className="-ml-1 mr-2 h-4 w-4" aria-hidden="true" />
                  Edit
                </Button>
              </div>
              <div className="border-t border-gray-200">
                <dl>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Store name</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {store.name}
                    </dd>
                  </div>
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Address</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {store.address}
                    </dd>
                  </div>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Average rating</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 flex items-center">
                      {renderRatingStars(Math.round(store.averageRating))}
                      <span className="ml-2">
                        {store.averageRating ? store.averageRating.toFixed(1) : 'No ratings'} ({store.totalRatings} {store.totalRatings === 1 ? 'rating' : 'ratings'})
                      </span>
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Customer Ratings</h2>
              {ratings.length === 0 ? (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 text-center">
                  <p className="text-gray-500">No ratings yet</p>
                </div>
              ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <ul className="divide-y divide-gray-200">
                    {ratings.map((rating) => (
                      <li key={rating.id} className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-500 font-medium">
                                  {rating.user.name.charAt(0)}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {rating.user.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {rating.user.email}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center">
                            {renderRatingStars(rating.rating)}
                            <span className="ml-2 text-sm text-gray-500">
                              {new Date(rating.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </>
        )}

        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Store"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Store Name
              </label>
              <input
                type="text"
                id="name"
                {...register('name')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-700"
              >
                Address
              </label>
              <textarea
                id="address"
                rows={3}
                {...register('address')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
              )}
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
                onClick={() => setIsEditModalOpen(false)}
                className="mt-3 w-full sm:col-start-1 sm:mt-0"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Modal>

        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create New Store"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Store Name
              </label>
              <input
                type="text"
                id="name"
                {...register('name')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Store name must be between 20 and 60 characters.
              </p>
            </div>

            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-700"
              >
                Address
              </label>
              <textarea
                id="address"
                rows={3}
                {...register('address')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Address must not exceed 400 characters.
              </p>
            </div>

            <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
              <Button
                type="submit"
                isLoading={isSubmitting}
                className="w-full sm:col-start-2"
              >
                Create
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsCreateModalOpen(false)}
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

export default Dashboard;
