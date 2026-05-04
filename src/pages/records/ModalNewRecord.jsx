import { useState } from 'react'
import { FaTimes } from 'react-icons/fa'
import InputPriceField from '../../components/InputPriceField'

const defaultFormData = {
  name: '',
  variety: '',
  notes: '',
  date_planted: '',
  seedling_count: '',
  batch_name: '',
  starting_fund: '',
  supplier: '',
  seedling_source: ''
}

function ModalNewRecord({ isOpen, onClose, onSubmit }) {
  const [formData, setFormData] = useState(defaultFormData)
  const plantVarieties = [
    "Vegetables",
    "Leafy Greens",
    "Root Crops",
    "Herbs",
    "Fruits",
    "Legumes",
    "Spices",
    "Mushrooms",
    "Ornamentals",
    "Medicinal Plants",
    "Vines",
    "Fruit Trees",
    "Other",
    "Unknown",
  ];

  const handleChange = (e) => {
    const { name, value } = e.target
    const nextState = {
      ...formData,
      [name]: value,
    }

    if (name === 'supplier') {
      nextState.seedling_source = value
    }

    if (name === 'seedling_source') {
      nextState.supplier = value
    }

    setFormData(nextState)
  }

  const resetForm = () => setFormData(defaultFormData)

  const handleSubmit = (e) => {
    e.preventDefault()

    const requiredFields = [
      'name',
      'variety',
      'batch_name',
      'seedling_count',
      'supplier',
      'starting_fund',
      'date_planted'
    ]

    const isValid = requiredFields.every((field) => {
      const value = formData[field]
      return typeof value === 'string' ? value.trim().length > 0 : Boolean(value)
    })

    if (!isValid) {
      return
    }

    onSubmit({
      ...formData,
      seedling_source: formData.seedling_source || formData.supplier,
    })
    resetForm()
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold">Add New Plant</h2>
            <p className="text-sm text-gray-500">Fill in the details to save a new plant record.</p>
          </div>
          <button
            type="button"
            className="text-gray-500 hover:text-gray-700 p-2 rounded-full"
            onClick={handleClose}
            aria-label=""
            title="Close modal"
          >
            <FaTimes />
          </button>
        </div>

        <form className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="font-medium">Name <span className="text-red-500">*</span></label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Tomato"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="variety" className="font-medium">Variety <span className="text-red-500">*</span></label>
            <select
              id="variety"
              name="variety"
              value={formData.variety}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            >
              <option value="">Select variety</option>
              {plantVarieties.map((variety) => (
                <option key={variety} value={variety}>{variety}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2 md:col-span-2">
            <label htmlFor="notes" className="font-medium">Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              placeholder="Add additional notes"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="batch_name" className="font-medium">Batch Name <span className="text-red-500">*</span></label>
            <input
              id="batch_name"
              name="batch_name"
              type="text"
              value={formData.batch_name}
              onChange={handleChange}
              placeholder="e.g. Batch 001"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="seedling_count" className="font-medium">Seedling Count <span className="text-red-500">*</span></label>
            <input
              id="seedling_count"
              name="seedling_count"
              type="text"
              value={formData.seedling_count}
              onChange={handleChange}
              placeholder="e.g. 120"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="supplier" className="font-medium">Seedling Source <span className="text-red-500">*</span></label>
            <input
              id="supplier"
              name="supplier"
              type="text"
              value={formData.supplier}
              onChange={handleChange}
              placeholder="e.g. Local Farm"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="starting_fund" className="font-medium">Starting Fund <span className="text-red-500">*</span></label>
            <InputPriceField
              id="starting_fund"
              name="starting_fund"
              placeholder="₱0"
              formData={formData}
              setFormData={setFormData}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="date_planted" className="font-medium">Date Planted <span className="text-red-500">*</span></label>
            <input
              id="date_planted"
              name="date_planted"
              type="date"
              value={formData.date_planted}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="md:col-span-2 flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-3 rounded-lg bg-green-600 text-white hover:bg-green-700 transition"
            >
              Add Plant
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ModalNewRecord
