import data from './placeholder-images.json';

export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
};

export const PlaceHolderImages: ImagePlaceholder[] = data.placeholderImages;

// Exporting the raw list for use in admin forms
export const placeholderImagesList: ImagePlaceholder[] = data.placeholderImages;
