"use client";
import { useGallery } from "../providers/GalleryProvider";
import ImageModal from "./ui/ImageModal";

export default function GalleryImageModal() {
  const {
    isImageModalOpen,
    closeImageModal,
    selectedArtwork,
    currentImageIndex,
    artworks,
    navigateImage,
  } = useGallery();


    isImageModalOpen,
    selectedArtwork,
    currentImageIndex,
    artworksLength: artworks.length,
  });

  return (
    <ImageModal
      isOpen={isImageModalOpen}
      onClose={closeImageModal}
      artwork={selectedArtwork}
      onNavigate={navigateImage}
      currentIndex={currentImageIndex}
      totalImages={artworks.length}
    />
  );
}
