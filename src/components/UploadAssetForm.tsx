import { ImagePlus, X } from "lucide-react";
import Image from "next/image";
import React, { useRef } from "react";

export default function Imagepkr({
    images,
    setImages
}: {
    images: File[];
    setImages: (images: File[]) => void;
}): React.ReactElement {
    const pickerRef = useRef<HTMLInputElement>(null);

    // Handle image selection via input change
    function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.files) {
            const pickedImages = Array.from(e.target.files);
            const newImages = pickedImages.filter(
                (image) => !images.some((img) => img.name === image.name)
            );
            if (newImages.length < pickedImages.length) {
                alert("Some images already exist and were not added.");
            }
            setImages([...images, ...newImages]);
        }
    }

    // Handle image removal
    function handleErase(image: File) {
        const newImages = images.filter((img) => img.name !== image.name);
        setImages(newImages);
    }

    // Handle drag-and-drop functionality
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (pickerRef.current && files.length > 0) {
            pickerRef.current.files = files;
            const event = new Event("change", { bubbles: true });
            pickerRef.current.dispatchEvent(event);
        }
    };

    return (
        <div className="w-full flex items-start gap-6 justify-center flex-wrap">
            {/* Upload button with drag-and-drop support */}
            <button
                aria-label="Upload images"
                className="cursor-pointer flex items-center justify-center rounded-md h-40 w-28 border-2 border-dashed border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                onClick={() => pickerRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
            >
                <span className="flex flex-col items-center justify-center text-red-600">
                    <ImagePlus className="h-8 w-8" />
                    <span className="flex flex-col items-center mt-3 text-xs text-zinc-600 dark:text-zinc-400">
                        <span>Upload</span>
                        <span>or</span>
                        <span>Drop</span>
                    </span>
                </span>
                <input
                    className="hidden"
                    multiple={true}
                    ref={pickerRef}
                    type="file"
                    name="imgpkr"
                    onChange={handleImageChange}
                    accept="image/*"
                    id="imgpkr"
                />
            </button>

            {/* Display selected images */}
            {images.map((image) => (
                <div className="relative group" key={image.name}>
                    <button
                        onClick={() => handleErase(image)}
                        className="absolute -top-2 -right-2 h-6 w-6 bg-red-600 rounded-full flex items-center justify-center text-white hover:bg-red-700 transition-colors z-10"
                    >
                        <X className="h-4 w-4" />
                    </button>
                    <div className="h-40 w-28 rounded-md overflow-hidden border border-zinc-200 dark:border-zinc-700">
                        <Image
                            className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                            src={URL.createObjectURL(image)}
                            alt={image.name}
                            height={200}
                            width={200}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}