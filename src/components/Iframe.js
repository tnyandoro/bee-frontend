import React from 'react';

const Iframe = () => {
  return (
    <iframe
      className="full-screen-preview__frame"
      src="https://theme-annakoot.web.app/"
      name="preview-frame"
      frameBorder="0"
      noResize="noresize"
      data-view="fullScreenPreview"
      allow="geolocation 'self'; autoplay 'self'"
    ></iframe>
  );
};

export default Iframe;
