import { ImagePlus } from "lucide-react";
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
                className="cursor-pointer  flex items-center justify-center rounded-md h-40 w-28 shadow-md"
                onClick={() => pickerRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
            >
                <span className="text-4xl text-red-600 flex flex-col items-center justify-center ">
                    <ImagePlus />
                    <span className="flex flex-col mt-4">
                        <span className="text-sm">Upload</span>
                        <span className="text-sm">Or</span>
                        <span className="text-sm">Drop</span>
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
                <span className="relative" key={image.name}>
                    <button
                        onClick={() => handleErase(image)}
                        className="absolute h-6 w-6 bg-red-500 rounded-full -top-2 -right-2 text-white"
                    >
                        X
                    </button>
                    <img
                        className="h-40 w-28 rounded-md object-cover"
                        src={URL.createObjectURL(image)}
                        alt={image.name}
                    />
                </span>
            ))}
        </div>
    );
}