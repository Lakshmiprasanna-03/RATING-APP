import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import Layout from '../../components/Layout';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import storeService from '../../services/storeService';
import authService from '../../services/authService';
import { validationSchemas } from '../../utils/validationSchemas';
import { MagnifyingGlassIcon, PlusIcon, StarIcon } from '@heroicons/react/24/outline';

const Stores = () => {
  const [stores, setStores] = useState([]);
  const [storeOwners, setStoreOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('ASC');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchemas.store),
  });

  useEffect(() => {
    fetchStores();
    fetchStoreOwners();
  }, [searchTerm, sortBy, sortOrder]);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const data = await storeService.getStores(searchTerm, sortBy, sortOrder);
      setStores(data);
    } catch (error) {
      toast.error('Failed to fetch stores');
    } finally {
      setLoading(false);
    }
  };

  const fetchStoreOwners = async () => {
    try {
      const users = await authService.getUsers('', 'name', 'ASC');
      setStoreOwners(users.filter(user => user.role === 'storeOwner'));
    } catch (error) {
      toast.error('Failed to fetch store owners');
    }
  };

  const handleSort = (key, order) => {
    setSortBy(key);
    setSortOrder(order);
  };

  const handleDelete = async (storeId) => {
    if (!window.confirm('Are you sure you want to delete this store?')) {
      return;
    }

    try {
      await storeService.deleteStore(storeId);
      toast.success('Store deleted successfully');
      fetchStores();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete store');
    }
  };

  const handleEdit = (store) => {
    setSelectedStore(store);
    reset({
      name: store.name,
      address: store.address,
      ownerId: store.ownerId,
    });
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedStore(null);
    reset({
      name: '',
      address: '',
      ownerId: storeOwners.length > 0 ? storeOwners[0].id : '',
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      if (selectedStore) {
        await storeService.updateStore(selectedStore.id, data);
        toast.success('Store updated successfully');
      } else {
        await storeService.createStore(data);
        toast.success('Store created successfully');
      }
      setIsModalOpen(false);
      reset();
      fetchStores();
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${selectedStore ? 'update' : 'create'} store`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'address', label: 'Address', sortable: true },
    {
      key: 'owner',
      label: 'Owner',
      render: (_, store) => store.owner?.name || 'Unknown',
    },
    {
      key: 'averageRating',
      label: 'Rating',
      sortable: true,
      render: (value) => (
        <div className="flex items-center">
          <StarIcon className="h-5 w-5 text-yellow-400 mr-1" />
          <span>{value ? value.toFixed(1) : 'No ratings'}</span>
        </div>
      ),
    },
    {
      key: 'totalRatings',
      label: 'Total Ratings',
      sortable: true,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, store) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleEdit(store)}
            className="text-blue-600 hover:text-blue-800"
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(store.id)}
            className="text-red-600 hover:text-red-800"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Stores</h1>
            <p className="mt-2 text-sm text-gray-700">
              Manage stores in the system
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <Button
              onClick={handleAddNew}
              className="inline-flex items-center"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Add Store
            </Button>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="max-w-sm w-full lg:max-w-xs">
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
        </div>

        <Table
          columns={columns}
          data={stores}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          isLoading={loading}
          emptyMessage="No stores found"
        />

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={selectedStore ? 'Edit Store' : 'Add New Store'}
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

            <div>
              <label
                htmlFor="ownerId"
                className="block text-sm font-medium text-gray-700"
              >
                Store Owner
              </label>
              <select
                id="ownerId"
                {...register('ownerId')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                {storeOwners.length === 0 ? (
                  <option value="">No store owners available</option>
                ) : (
                  storeOwners.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.name} ({owner.email})
                    </option>
                  ))
                )}
              </select>
              {errors.ownerId && (
                <p className="mt-1 text-sm text-red-600">{errors.ownerId.message}</p>
              )}
            </div>

            <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
              <Button
                type="submit"
                isLoading={isSubmitting}
                className="w-full sm:col-start-2"
                disabled={storeOwners.length === 0}
              >
                {selectedStore ? 'Update' : 'Create'}
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
