import { useState, useEffect, useRef } from 'react';
import { FaSearch, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import ModalNewRecord from './records/ModalNewRecord';
import ModalEditRecord from './records/ModalEditRecord';
import PlantLoading from '../components/PlantLoading';
import { api } from '../api';
import { toast } from 'sonner';

const PAGE_SIZE = 12;

function Records() {
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dataToUpdate, setDataToUpdate] = useState(null);
  const [isEditRecord, setIsEditRecord] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  //pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const isInInitialMount = useRef(true);
  const searchTimeoutRef = useRef(null);

  // Helper function for API calls with retry logic
  const apiCallWithRetry = async (apiCall, maxRetries = 2) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error) {
        console.warn(`API call attempt ${attempt} failed:`, error.message);

        if (attempt === maxRetries) {
          throw error;
        }

        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  };

  // Retry loading records
  const retryLoadRecords = () => {
    setLoadError(null);
    handleLoadRecords(1, false);
  };

  // Debounce search term
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms delay

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  const handleSearchPlants = async (query = '') => {
    try {
      setIsLoading(true);
      console.log(`Searching database for: "${query}"`);

      const response = await apiCallWithRetry(() => api.get(`plants/search?q=${encodeURIComponent(query)}`));

      // Handle different possible response structures
      let searchResults = [];
      if (response.data) {
        if (response.data.data && Array.isArray(response.data.data)) {
          searchResults = response.data.data;
        } else if (Array.isArray(response.data)) {
          searchResults = response.data;
        } else if (response.data.records && Array.isArray(response.data.records)) {
          searchResults = response.data.records;
        } else {
          console.warn('Unexpected search API response structure:', response.data);
          searchResults = [];
        }
      }

      console.log(`Found ${searchResults.length} records matching search query`);
      setRecords(searchResults);
      setHasMore(false); // Disable pagination during search

      // Clear any previous errors on successful search
      setLoadError(null);

    } catch (error) {
      console.error('Error searching records in database:', error);
      toast.error('Failed to search records in database');
      setRecords([]); // Clear records on search error
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }
  const handleLoadRecords = async (page = 1, append = false) => {
    try {
      setIsLoading(true);
      if (append) setIsLoadingMore(true);

      const response = await api.get('plants', {
        params: {
          page,
          per_page: PAGE_SIZE,
        },
      });

      const { data, pagination } = response.data;
      
      setRecords(append ? (prev) => [...prev, ...data] : data);
      setCurrentPage(pagination.current_page);
      setLastPage(pagination.last_page);
      setHasMore(pagination.current_page < pagination.last_page);
    } catch (error) {
      console.error('Error loading records from database:', error);
      setLoadError('Failed to load records from database. Please check your connection and try again.');
      toast.error('Failed to load records from database');

      // Reset loading states on error
      setIsLoading(false);
      setIsLoadingMore(false);

      // If this is the initial load and it fails, set empty records
      if (!append) {
        setRecords([]);
        setHasMore(false);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }
  const handleAddRecord = async (formData) => {
    try {
      const payload = {
        ...formData,
        seedling_source: formData.seedling_source || formData.supplier,
      }

      const response = await api.post('plants', payload)
      const createdRecord = response.data?.data || response.data || payload

      setRecords((prev) => [createdRecord, ...prev])
      toast.success('New record saved.')
      setIsModalOpen(false)
    } catch (error) {
      console.error(error)
      toast.error('Error encountered while saving record.')
    }
  }
  const handleUpdateRecord = async (data) => {
    try {
      const payload = {
        ...data,
        seedling_source: data.seedling_source ?? data.supplier,
      }

      const response = await api.put(`plants/${data.id}`, payload)
      const updatedRecord = response.data?.data || response.data || payload

      setRecords((prev) => prev.map((record) => (
        record.id === updatedRecord.id ? updatedRecord : record
      )))
      toast.success('Plant data updated.')
      setIsEditRecord(false)
    } catch (error) {
      console.error(error)
      toast.error('Error encountered during update.')
    }
  }
  const handleDeleteRecord = async (data) => {
    const isDelete = confirm("Are you sure you want to delete this record?");
    if (!isDelete) {
      return;
    }

    setDeletingId(data.id);

    try {
      await api.delete(`plants/${data.id}`);
      setRecords((prev) => prev?.filter((val) => data.id !== val.id));
      toast.success("Plant data deleted.");
    } catch (error) {
      console.error(error);
      toast.error("Error encountered while deleting record.");
    } finally {
      setDeletingId(null);
    }
  }
  const filteredRecords = records.filter(record =>
    record.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.variety?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.seedling_source?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePageChange = (page) => {
    if (page < 1 || page > lastPage || page === currentPage) return
    handleLoadRecords(page)
  }

  // initial record loading
  useEffect(() => {
    handleLoadRecords(1)
  }, []);
  // reset pagination when searching
  useEffect(() => {
    if (isInInitialMount.current) {
      isInInitialMount.current = false;
      return;
    }
    if (debouncedSearchTerm) {
      setCurrentPage(1);
      setHasMore(false);
      handleSearchPlants(debouncedSearchTerm);
    } else {
      setCurrentPage(1);
      setHasMore(true);
      handleLoadRecords(1);
    }
  }, [debouncedSearchTerm]);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div className='flex flex-grow'></div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 
          transition duration-200 flex items-center gap-2 cursor-pointer"
        >
          <FaPlus />
          Add New Record
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100 mb-6">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 
              focus:ring-green-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Records Table */}
      {/* TODO implement pagination plants table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto max-h-[580px] overflow-y-auto">
          <table className="relative w-full">
            <thead className="bg-green-50 sticky top-0 z-10">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Plant Name</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Variety</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Batch Name</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Seedling Source</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Seedling Count</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Starting Fund</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Date Planted</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700"></th>
              </tr>
            </thead>
            <tbody>

              {
                isLoading && records.length === 0 ?
                  (
                    <tr>
                      <td colSpan={8} className='py-10'>
                        <PlantLoading size='2xl' variant='pulse' text="Loading records" />
                      </td>
                    </tr>
                  ) : (
                    <>
                      {displayRecords.map((record) => (
                        <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-4 px-6 text-sm text-gray-800 font-medium">{record.name}</td>
                          <td className="py-4 px-6 text-sm text-gray-600">{record?.variety || "-"}</td>
                          <td className="py-4 px-6 text-sm text-gray-600">{record?.batch_name || "-"}</td>
                          <td className="py-4 px-6 text-sm text-gray-800 font-medium">{record?.seedling_source || "-"}</td>
                          <td className="py-4 px-6 text-sm text-gray-600">{record?.seedling_count || "-"}</td>
                          <td className="py-4 px-6 text-sm text-gray-600">{record?.starting_fund || "0"}</td>
                          <td className="py-4 px-6 text-sm text-gray-600">{record?.date_planted || "-"}</td>
                          <td className="py-4 px-6">
                            <div className="flex gap-2">
                              <button className="cursor-pointer text-blue-600 hover:text-blue-700 p-2 hover:bg-blue-50 rounded"
                                title="Edit Record"
                                onClick={() => { setDataToUpdate(record); setIsEditRecord(true) }}>
                                <FaEdit />
                              </button>
                              <button
                                type="button"
                                className="cursor-pointer text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded"
                                onClick={() => { handleDeleteRecord(record) }}
                                title="Delete Record"
                                disabled={deletingId === record.id}
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}


                    </>
                  )
              }
            </tbody>
          </table>
        </div>

        {!searchTerm && (
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
            <p className="text-sm text-gray-600">
              Page {currentPage} of {lastPage}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1 || isLoading}
                onClick={() => handlePageChange(currentPage - 1)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={!hasMore || isLoading}
                onClick={() => handlePageChange(currentPage + 1)}
                className="rounded-lg border border-green-600 bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {searchTerm && filteredRecords.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No records found matching your search.
          </div>
        )}

        {/* End of Records Indicator */}
        {!hasMore && records.length > 0 && !debouncedSearchTerm && (
          <div className="text-center py-4 text-gray-400 text-sm border-t border-gray-100">
            No more records to load
          </div>
        )}

        {/* Error Display */}
        {loadError && records.length === 0 && !isLoading && (
          <div className="text-center py-8 px-4">
            <div className="text-red-600 mb-4">{loadError}</div>
            <button
              onClick={retryLoadRecords}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry Loading
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      <ModalNewRecord
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddRecord}
      />

      <ModalEditRecord
        isOpen={isEditRecord}
        onClose={() => setIsEditRecord(false)}
        data={dataToUpdate}
        onSubmit={handleUpdateRecord}
      />
    </div>
  )
}

export default Records
