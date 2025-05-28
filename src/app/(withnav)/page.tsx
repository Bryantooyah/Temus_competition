'use client';

import Link from 'next/link';
import { meta } from './meta';

function CatalogPage() {
  return (
    <div className="flex-1 flex flex-column align-items-center p-6">
      <div style={{ maxWidth: 1200 }} className="w-full">
        <div className="flex justify-content-between align-items-center mb-8">
          <h1 className="text-3xl font-semibold text-gray-800 m-0">Temus</h1>
        </div>
        <div className="w-full">
          <div className="grid gap-4">
            {meta.map(({ title, description, href }) => (
              <div key={href} className="col-12 sm:col-6 md:col-4">
                <div className="border-1 hover:surface-100 border-round border-300 h-full p-4 cursor-pointer no-underline shadow-sm hover:shadow-md transition-all duration-200">
                  <Link 
                    href={href} 
                    className="inline-block no-underline h-full w-full"
                  >
                    <p className="text-xl font-medium mb-2 text-gray-800">{title}</p>
                    <p className="text-sm text-gray-600 line-height-3">{description}</p>

                    <div className="mt-2 flex align-items-center gap-2">
                      <i className={`pi pi-volume-up text-sm`}></i>
                      <span className="text-sm">Audio Chat</span>

                    </div>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CatalogPage
