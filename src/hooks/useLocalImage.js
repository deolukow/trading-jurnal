import { useState, useEffect } from "react";
import { getItem } from "../config/db";

// --- Custom Hook to load local images ---
export const useLocalImage = (imageId) => {
  const [imageUrl, setImageUrl] = useState(null);

  useEffect(() => {
    let objectUrl = null;
    if (imageId) {
      getItem("trade_images", imageId)
        .then((imageRecord) => {
          if (imageRecord && imageRecord.file) {
            objectUrl = URL.createObjectURL(imageRecord.file);
            setImageUrl(objectUrl);
          } else {
            setImageUrl(null);
          }
        })
        .catch((err) => {
          console.error("Failed to load image from DB", err);
          setImageUrl(null);
        });
    } else {
      setImageUrl(null);
    }

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [imageId]);

  return imageUrl;
};

export default useLocalImage;
