// components/HubSpotForm.js
"use client";

import { useEffect } from 'react';

const HubSpotForm = ({ portalId, formId }) => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.hsforms.net/forms/v2.js';
    document.body.appendChild(script);

    script.addEventListener('load', () => {
      if (window.hbspt) {
        window.hbspt.forms.create({
          portalId: portalId,
          formId: formId,
          target: '#hubspotForm'
        });
      }
    });

    // Clean up the script on component unmount
    return () => {
      document.body.removeChild(script);
    };
  }, [portalId, formId]);

  return (
    <div id="hubspotForm"></div>
  );
};

export default HubSpotForm;
