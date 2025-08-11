import React, { useState, useRef } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

function getCroppedImg(image, crop, fileName) {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext('2d');

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob(blob => {
      if (!blob) {
        console.error('Canvas is empty');
        return;
      }
      blob.name = fileName;
      resolve(blob);
    }, 'image/jpeg');
  });
}

const ImageCropModal = ({ isOpen, onClose, imageSrc, onCropComplete }) => {
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState();
  const imgRef = useRef(null);

  function onImageLoad(e) {
    const { width, height } = e.currentTarget;
    const newCrop = centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, 1, width, height),
      width,
      height
    );
    setCrop(newCrop);
  }

   const handleCrop = async () => {
    if (!completedCrop || !imgRef.current) {
      return;
    }
    
    try {
      const croppedBlob = await getCroppedImg(
        imgRef.current,
        completedCrop,
        'newAvatar.jpeg'
      );

      if (croppedBlob) {
        onCropComplete(croppedBlob);
      } else {
        const originalFile = await fetch(imageSrc).then(res => res.blob());
        onCropComplete(originalFile);
        toast.warn("Could not crop image on this device. Using original image instead.");
      }
    } catch (error) {
        console.error("Cropping failed:", error);
        const originalFile = await fetch(imageSrc).then(res => res.blob());
        onCropComplete(originalFile);
        toast.error("An error occurred during cropping. Using original image.");
    } finally {
        onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Crop Your Image</h2>
        <div className="flex justify-center">
          <ReactCrop
            crop={crop}
            onChange={c => setCrop(c)}
            onComplete={c => setCompletedCrop(c)}
            aspect={1}
            circularCrop
          >
            <img 
              ref={imgRef}
              src={imageSrc} 
              onLoad={onImageLoad}
              alt="Crop preview" 
              style={{ maxHeight: '70vh' }}
            />
          </ReactCrop>
        </div>
        <div className="flex justify-end space-x-4 mt-6">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-slate-700 bg-slate-200 hover:bg-slate-300">Cancel</button>
          <button type="button" onClick={handleCrop} className="px-4 py-2 rounded-md font-semibold text-white bg-accent-600 hover:bg-accent-700">
            Save Image
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropModal;
