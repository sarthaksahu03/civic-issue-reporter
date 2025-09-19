// Add grecaptcha to window type for TypeScript
declare global {
  interface Window {
    grecaptcha?: any;
  }
}
import React from 'react';

// This is a simple wrapper for Google reCAPTCHA v2
// Usage: <ReCAPTCHA siteKey="your-site-key" onChange={token => ...} />


const getUniqueId = (() => {
  let counter = 0;
  return () => `recaptcha-container-${++counter}`;
})();

const ReCAPTCHA: React.FC<{
  siteKey: string;
  onChange: (token: string | null) => void;
}> = ({ siteKey, onChange }) => {
  const containerId = React.useRef(getUniqueId());

  React.useEffect(() => {
    if (document.getElementById('recaptcha-script')) return;
    const script = document.createElement('script');
    script.id = 'recaptcha-script';
    script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, []);

  React.useEffect(() => {
    const renderWidget = () => {
      if (!window.grecaptcha) return;
      if (document.getElementById(containerId.current)?.children.length) return; // already rendered
      window.grecaptcha.render(containerId.current, {
        sitekey: siteKey,
        callback: onChange,
        'expired-callback': () => onChange(null),
      });
    };
    if (window.grecaptcha && window.grecaptcha.render) {
      renderWidget();
    } else {
      const interval = setInterval(() => {
        if (window.grecaptcha && window.grecaptcha.render) {
          clearInterval(interval);
          renderWidget();
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, [siteKey, onChange]);

  return <div id={containerId.current} />;
};

export default ReCAPTCHA;
