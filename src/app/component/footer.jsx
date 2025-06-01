import { MapPinHouseIcon } from 'lucide-react';

import React from 'react';

export const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-10 w-full mt-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        <div>
          <h3 className="text-lg font-bold mb-4">About</h3>
          <p className="text-gray-400 mb-4">
            I am Aparna Pradhan, a passionate developer creating innovative solutions for my clients.
          </p>
         
        </div>
        <div>
          <h3 className="text-lg font-bold mb-4">Services</h3>
          <ul className="text-gray-400 space-y-2">
          <p className="text-gray-400 mb-2 hover:text-white">Web Development</p>
          <p className="text-gray-400 mb-2 hover:text-white">Mobile Development</p>
          <p className="text-gray-400 mb-2 hover:text-white">AI & ML Integration</p>
   
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-bold mb-4">Contact</h3>
          <ul className="text-gray-400 space-y-2">
            <li>Email : softservicesinc.portfolio@gmail.com </li>
            
            <li>Address : West Bengal, India 🇮🇳 <br />PIN : 721140 <br /> 
            
             <a href="https://goo.gl/maps/SQUjHtzSMfeZfmWR7" >
              <b>Google Maps</b> <MapPinHouseIcon/>  </a> </li>
          </ul>
        </div>
        <div>
        <h3 className="text-lg font-bold mb-4">Follow Me</h3>
<div className="flex space-x-4">
 
  <a href="https://www.linkedin.com/in/aparna-pradhan-06b882215/" target="_blank" className="text-gray-400 hover:text-white">
    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M4.98 3.5C4.98 2.12 6.1 1 7.5 1s2.52 1.12 2.52 2.5S8.9 6 7.5 6 4.98 4.88 4.98 3.5zM3 8.5h4v12H3v-12zM10.5 8.5h3.3v1.78h.04c.46-.87 1.57-1.78 3.23-1.78 3.45 0 4.1 2.26 4.1 5.2v6h-4v-5.33c0-1.27-.03-2.9-1.77-2.9-1.77 0-2.04 1.39-2.04 2.82V20.5h-4v-12z" />
    </svg>
  </a>
 
  <a href="https://x.com/Aparna_108_dev/" target="_blank" className="text-gray-400 hover:text-white">
    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.94 4.56c-.88.39-1.83.65-2.83.77 1.02-.61 1.8-1.57 2.17-2.72-.95.56-2 .97-3.12 1.19a5.43 5.43 0 00-9.26 4.96C7.69 8.87 4.07 7.16 1.64 4.16c-.57.98-.89 2.11-.89 3.32 0 2.29 1.16 4.3 2.91 5.48a5.4 5.4 0 01-2.46-.68v.07c0 3.2 2.28 5.87 5.3 6.47-.55.15-1.12.23-1.7.23-.42 0-.83-.04-1.23-.11.83 2.6 3.23 4.5 6.08 4.55a10.88 10.88 0 01-6.73 2.32c-.44 0-.87-.03-1.3-.08a15.3 15.3 0 008.26 2.42c9.9 0 15.29-8.2 15.29-15.29l-.02-.7A10.98 10.98 0 0024 4.56z" />
    </svg>
  </a>
 
  <a href="https://www.instagram.com/0_aparna_pradhan_1/" target="_blank" className="text-gray-400 hover:text-white">
    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M7.75 2h8.5C19.99 2 22 4.01 22 7.75v8.5C22 19.99 19.99 22 16.25 22h-8.5C4.01 22 2 19.99 2 16.25v-8.5C2 4.01 4.01 2 7.75 2zm0 2C5.68 4 4 5.68 4 7.75v8.5C4 18.32 5.68 20 7.75 20h8.5C18.32 20 20 18.32 20 16.25v-8.5C20 5.68 18.32 4 16.25 4h-8.5zm6.25 5a4.25 4.25 0 110 8.5 4.25 4.25 0 010-8.5zm0 2c-1.24 0-2.25 1-2.25 2.25S12.76 15.5 14 15.5 16.25 14.5 16.25 13 15.24 11 14 11zM18.5 6.75a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0z" />
    </svg>
  </a>
 
 
 
</div></div> </div> </footer>)}