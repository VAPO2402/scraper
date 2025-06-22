"use client"

import { FormEvent, Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import Image from 'next/image'
import { addUserEmailToProduct } from '@/lib/actions'

interface Props {
  productId: string
}

const Modal = ({ productId }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    setError('');

    try {
      const result = await addUserEmailToProduct(productId, email);
      setMessage(result.message);
      setEmail('');
      setTimeout(() => closeModal(), 2000); // Close after 2s to show message
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const openModal = () => setIsOpen(true);

  const closeModal = () => {
    setIsOpen(false);
    setMessage('');
    setError('');
  };

  return (
    <>
      <button
        type="button"
        className="p-2 bg-[#212121] text-white rounded-md hover:bg-[#333] transition"
        onClick={openModal}
      >
        Track
      </button>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" onClose={() => {}} className="dialog-container">
          <div className="min-h-screen px-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Overlay className="fixed inset-0 bg-black/50" />
            </Transition.Child>

            <span
              className="inline-block h-screen align-middle"
              aria-hidden="true"
            />

            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <div className="dialog-content bg-white rounded-lg p-6 max-w-md mx-auto">
                <div className="flex flex-col">
                  <div className="flex justify-between">
                    <div className="p-3 border border-gray-200 rounded-10">
                      <Image
                        src="/assets/icons/logo.svg"
                        alt="logo"
                        width={28}
                        height={28}
                      />
                    </div>

                    <Image
                      src="/assets/icons/x-close.svg"
                      alt="close"
                      width={24}
                      height={24}
                      className="cursor-pointer"
                      onClick={closeModal}
                    />
                  </div>

                  <h4 className="dialog-head_text text-lg font-semibold text-gray-800 mt-4">
                    Stay updated with product pricing alerts right in your inbox!
                  </h4>

                  <p className="text-sm text-gray-600 mt-2">
                    Never miss a bargain again with our timely alerts!
                  </p>
                </div>

                <form className="flex flex-col mt-5" onSubmit={handleSubmit}>
                  <label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <div className="dialog-input_container flex items-center border rounded-md p-2 mt-1">
                    <Image
                      src="/assets/icons/mail.svg"
                      alt="mail"
                      width={18}
                      height={18}
                    />
                    <input
                      required
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="dialog-input flex-1 ml-2 outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="dialog-btn p-2 bg-[#212121] text-white rounded-md hover:bg-[#333] transition disabled:opacity-50 mt-4"
                  >
                    {isSubmitting ? 'Submitting...' : 'Track'}
                  </button>
                </form>

                {message && (
                  <p className="mt-4 text-green-600 text-sm">{message}</p>
                )}
                {error && (
                  <p className="mt-4 text-red-600 text-sm">{error}</p>
                )}
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </>
  )
}

export default Modal