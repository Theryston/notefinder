"use client";

import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useJobs } from "@/hooks/useJobs";

export default function QueueModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { data: jobs = [] } = useJobs(50, 2000);
  const activeJobs = jobs.filter(
    (j) => j.status === "pending" || j.status === "processing"
  );

  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-[1000]">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-150"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-start justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-2"
              enterTo="opacity-100 translate-y-0"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-2"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl border bg-white dark:bg-zinc-900 p-0 text-left align-middle shadow-xl">
                <div className="p-4 border-b flex items-center justify-between">
                  <Dialog.Title className="font-semibold">
                    Fila de Processamento
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="px-2 py-1 text-sm rounded-full border hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    Fechar
                  </button>
                </div>
                <div className="p-4 max-h-[70vh] overflow-y-auto space-y-3">
                  {activeJobs.length === 0 ? (
                    <div className="text-sm text-gray-500">
                      Nenhum job em processamento no momento
                    </div>
                  ) : (
                    activeJobs.map((job) => (
                      <div
                        key={job.id}
                        className="border rounded-xl p-3 hover:shadow-sm transition"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div>
                            <div className="text-sm text-gray-700 dark:text-gray-200 font-medium">
                              {job.content_type === "youtube"
                                ? "YouTube"
                                : "Arquivo"}
                            </div>
                            <div className="text-xs text-gray-500 break-all">
                              {job.content_path}
                            </div>
                          </div>
                          <div
                            className={`text-xs capitalize ${
                              job.status === "processing"
                                ? "text-brand-700"
                                : "text-gray-500"
                            }`}
                          >
                            {job.status}
                          </div>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full">
                          <div
                            className="h-2 bg-brand-600 rounded-full"
                            style={{ width: `${job.progress ?? 0}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>{job.progress ?? 0}%</span>
                          <span>{job.progress_message || ""}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
