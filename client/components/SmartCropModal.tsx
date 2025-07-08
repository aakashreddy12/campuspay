import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { X, RotateCw, Crop, Sparkles } from "lucide-react";

interface SmartCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  placement: string;
  onCropComplete: (croppedImageUrl: string) => void;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function SmartCropModal({
  isOpen,
  onClose,
  imageUrl,
  placement,
  onCropComplete,
}: SmartCropModalProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [cropArea, setCropArea] = useState<CropArea>({
    x: 0,
    y: 0,
    width: 200,
    height: 150,
  });
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [smartCropMode, setSmartCropMode] = useState<"manual" | "smart">(
    "manual",
  );

  // Get aspect ratio based on placement
  const getAspectRatio = () => {
    switch (placement) {
      case "top-banner":
      case "footer-banner":
        return 16 / 4;
      case "sidebar":
        return 1 / 1.5;
      case "inline-card":
        return 4 / 3;
      case "interstitial":
        return 9 / 16;
      case "floating-cta":
        return 1;
      default:
        return 16 / 9;
    }
  };

  // Initialize crop area when image loads
  useEffect(() => {
    if (imageLoaded && imageRef.current) {
      const img = imageRef.current;
      const aspectRatio = getAspectRatio();

      let width, height;
      if (img.width / img.height > aspectRatio) {
        // Image is wider than target aspect ratio
        height = img.height * 0.8;
        width = height * aspectRatio;
      } else {
        // Image is taller than target aspect ratio
        width = img.width * 0.8;
        height = width / aspectRatio;
      }

      setCropArea({
        x: (img.width - width) / 2,
        y: (img.height - height) / 2,
        width,
        height,
      });
    }
  }, [imageLoaded, placement]);

  // Smart crop using AI-powered analysis
  const performSmartCrop = async () => {
    if (!imageRef.current) return;

    const img = imageRef.current;
    const aspectRatio = getAspectRatio();

    // Create a canvas to analyze the image
    const analysisCanvas = document.createElement("canvas");
    const ctx = analysisCanvas.getContext("2d");
    if (!ctx) return;

    analysisCanvas.width = img.width;
    analysisCanvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    // Get image data for analysis
    const imageData = ctx.getImageData(0, 0, img.width, img.height);
    const data = imageData.data;

    // Simple edge detection and interest point analysis
    const interestMap = new Array(img.height)
      .fill(0)
      .map(() => new Array(img.width).fill(0));

    // Calculate interest score for each pixel based on color variance
    for (let y = 1; y < img.height - 1; y++) {
      for (let x = 1; x < img.width - 1; x++) {
        const idx = (y * img.width + x) * 4;
        const neighbors = [
          data[((y - 1) * img.width + x) * 4], // top
          data[((y + 1) * img.width + x) * 4], // bottom
          data[(y * img.width + x - 1) * 4], // left
          data[(y * img.width + x + 1) * 4], // right
        ];

        const current = data[idx];
        const variance = neighbors.reduce(
          (sum, neighbor) => sum + Math.abs(current - neighbor),
          0,
        );
        interestMap[y][x] = variance;
      }
    }

    // Find the region with highest interest for the target aspect ratio
    let bestScore = 0;
    let bestCrop = { x: 0, y: 0, width: img.width, height: img.height };

    const targetWidth =
      aspectRatio >= 1
        ? Math.min(img.width, img.height * aspectRatio)
        : img.width;
    const targetHeight =
      aspectRatio >= 1
        ? targetWidth / aspectRatio
        : Math.min(img.height, img.width / aspectRatio);

    // Sample different crop positions
    const stepSize = Math.max(
      1,
      Math.floor(Math.min(img.width, img.height) / 20),
    );

    for (let y = 0; y <= img.height - targetHeight; y += stepSize) {
      for (let x = 0; x <= img.width - targetWidth; x += stepSize) {
        let score = 0;
        let sampleCount = 0;

        // Sample interest points in this crop area
        for (
          let sy = y;
          sy < y + targetHeight;
          sy += Math.max(1, Math.floor(targetHeight / 10))
        ) {
          for (
            let sx = x;
            sx < x + targetWidth;
            sx += Math.max(1, Math.floor(targetWidth / 10))
          ) {
            if (sy < img.height && sx < img.width) {
              score += interestMap[sy][sx];
              sampleCount++;
            }
          }
        }

        // Add bias towards center and rule of thirds
        const centerX = img.width / 2;
        const centerY = img.height / 2;
        const cropCenterX = x + targetWidth / 2;
        const cropCenterY = y + targetHeight / 2;

        const centerBias =
          1 -
          (Math.abs(cropCenterX - centerX) / centerX +
            Math.abs(cropCenterY - centerY) / centerY) /
            2;

        // Rule of thirds bias (prefer crops that align with thirds)
        const thirdX = img.width / 3;
        const thirdY = img.height / 3;
        const thirdsBias = Math.min(
          1 - Math.abs((cropCenterX % thirdX) - thirdX / 2) / (thirdX / 2),
          1 - Math.abs((cropCenterY % thirdY) - thirdY / 2) / (thirdY / 2),
        );

        const avgScore = sampleCount > 0 ? score / sampleCount : 0;
        const finalScore = avgScore * (1 + centerBias * 0.3 + thirdsBias * 0.2);

        if (finalScore > bestScore) {
          bestScore = finalScore;
          bestCrop = { x, y, width: targetWidth, height: targetHeight };
        }
      }
    }

    setCropArea(bestCrop);
    setSmartCropMode("smart");
  };

  const handleCropMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!imageRef.current) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDragging(true);
    setDragStart({ x, y });
  };

  const handleCropMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !imageRef.current) return;

    e.preventDefault();

    const containerRect =
      e.currentTarget.parentElement?.getBoundingClientRect();
    if (!containerRect) return;

    const x = e.clientX - containerRect.left;
    const y = e.clientY - containerRect.top;

    const deltaX =
      (x - dragStart.x) * (imageRef.current.width / containerRect.width);
    const deltaY =
      (y - dragStart.y) * (imageRef.current.height / containerRect.height);

    setCropArea((prev) => ({
      ...prev,
      x: Math.max(
        0,
        Math.min(imageRef.current!.width - prev.width, prev.x + deltaX),
      ),
      y: Math.max(
        0,
        Math.min(imageRef.current!.height - prev.height, prev.y + deltaY),
      ),
    }));

    setDragStart({ x, y });
  };

  const handleCropMouseUp = () => {
    setIsDragging(false);
  };

  // Add global mouse move and up handlers
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!imageRef.current) return;

      const containerRect = document
        .querySelector(".crop-container")
        ?.getBoundingClientRect();
      if (!containerRect) return;

      const x = e.clientX - containerRect.left;
      const y = e.clientY - containerRect.top;

      const deltaX =
        (x - dragStart.x) * (imageRef.current.width / containerRect.width);
      const deltaY =
        (y - dragStart.y) * (imageRef.current.height / containerRect.height);

      setCropArea((prev) => ({
        ...prev,
        x: Math.max(
          0,
          Math.min(imageRef.current!.width - prev.width, prev.x + deltaX),
        ),
        y: Math.max(
          0,
          Math.min(imageRef.current!.height - prev.height, prev.y + deltaY),
        ),
      }));

      setDragStart({ x, y });
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleGlobalMouseMove);
    document.addEventListener("mouseup", handleGlobalMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isDragging, dragStart]);

  const applyCrop = async () => {
    if (!imageRef.current) return;

    // Create a new canvas for cropping
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to crop area
    canvas.width = cropArea.width;
    canvas.height = cropArea.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply transformations
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);

    // Draw the cropped portion of the image
    ctx.drawImage(
      imageRef.current,
      cropArea.x,
      cropArea.y,
      cropArea.width,
      cropArea.height,
      -cropArea.width / 2,
      -cropArea.height / 2,
      cropArea.width,
      cropArea.height,
    );

    ctx.restore();

    // Convert to blob and create URL
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const croppedUrl = e.target?.result as string;
            onCropComplete(croppedUrl);
            onClose();
          };
          reader.readAsDataURL(blob);
        }
      },
      "image/jpeg",
      0.9,
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crop className="h-5 w-5" />
            Smart Crop for{" "}
            {placement
              .replace(/-/g, " ")
              .replace(/\b\w/g, (l) => l.toUpperCase())}
          </DialogTitle>
          <DialogDescription>
            Crop and adjust your image for optimal display in the selected ad
            placement
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Crop Mode Selection */}
          <div className="flex gap-2">
            <Button
              variant={smartCropMode === "manual" ? "default" : "outline"}
              size="sm"
              onClick={() => setSmartCropMode("manual")}
            >
              Manual Crop
            </Button>
            <Button
              variant={smartCropMode === "smart" ? "default" : "outline"}
              size="sm"
              onClick={performSmartCrop}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Sparkles className="h-4 w-4 mr-1" />
              AI Smart Crop
            </Button>
          </div>

          {/* Main Crop Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Original Image with Crop Overlay */}
            <div className="lg:col-span-2 space-y-4">
              <div className="relative border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
                <img
                  ref={imageRef}
                  src={imageUrl}
                  alt="Original"
                  className="max-w-full max-h-96 object-contain"
                  onLoad={() => setImageLoaded(true)}
                  style={{
                    transform: `rotate(${rotation}deg) scale(${scale})`,
                    transformOrigin: "center center",
                  }}
                />

                {/* Crop Overlay */}
                {imageLoaded && imageRef.current && (
                  <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                    <div
                      className="absolute border-2 border-purple-500 bg-purple-500/10 cursor-move pointer-events-auto"
                      style={{
                        left: `${(cropArea.x / imageRef.current.width) * 100}%`,
                        top: `${(cropArea.y / imageRef.current.height) * 100}%`,
                        width: `${(cropArea.width / imageRef.current.width) * 100}%`,
                        height: `${(cropArea.height / imageRef.current.height) * 100}%`,
                      }}
                      onMouseDown={handleCanvasMouseDown}
                      onMouseMove={handleCanvasMouseMove}
                      onMouseUp={handleCanvasMouseUp}
                      onMouseLeave={handleCanvasMouseUp}
                    >
                      {/* Corner handles */}
                      <div className="absolute -top-1 -left-1 w-3 h-3 bg-purple-500 border border-white rounded-full"></div>
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 border border-white rounded-full"></div>
                      <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-purple-500 border border-white rounded-full"></div>
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-purple-500 border border-white rounded-full"></div>

                      {/* Center indicator */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-purple-500 rounded-full"></div>
                    </div>

                    {/* Dimmed overlay outside crop area */}
                    <div
                      className="absolute inset-0 bg-black/30 pointer-events-none"
                      style={{
                        clipPath: `polygon(0 0, ${(cropArea.x / imageRef.current.width) * 100}% 0, ${(cropArea.x / imageRef.current.width) * 100}% 100%, 0 100%), polygon(${((cropArea.x + cropArea.width) / imageRef.current.width) * 100}% 0, 100% 0, 100% 100%, ${((cropArea.x + cropArea.width) / imageRef.current.width) * 100}% 100%), polygon(${(cropArea.x / imageRef.current.width) * 100}% 0, ${((cropArea.x + cropArea.width) / imageRef.current.width) * 100}% 0, ${((cropArea.x + cropArea.width) / imageRef.current.width) * 100}% ${(cropArea.y / imageRef.current.height) * 100}%, ${(cropArea.x / imageRef.current.width) * 100}% ${(cropArea.y / imageRef.current.height) * 100}%), polygon(${(cropArea.x / imageRef.current.width) * 100}% ${((cropArea.y + cropArea.height) / imageRef.current.height) * 100}%, ${((cropArea.x + cropArea.width) / imageRef.current.width) * 100}% ${((cropArea.y + cropArea.height) / imageRef.current.height) * 100}%, ${((cropArea.x + cropArea.width) / imageRef.current.width) * 100}% 100%, ${(cropArea.x / imageRef.current.width) * 100}% 100%)`,
                      }}
                    ></div>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Width: {Math.round(cropArea.width)}px</Label>
                  <Slider
                    value={[cropArea.width]}
                    onValueChange={([value]) =>
                      setCropArea((prev) => ({
                        ...prev,
                        width: Math.min(
                          value,
                          (imageRef.current?.width || 0) - prev.x,
                        ),
                      }))
                    }
                    min={50}
                    max={imageRef.current?.width || 400}
                    step={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Height: {Math.round(cropArea.height)}px</Label>
                  <Slider
                    value={[cropArea.height]}
                    onValueChange={([value]) =>
                      setCropArea((prev) => ({
                        ...prev,
                        height: Math.min(
                          value,
                          (imageRef.current?.height || 0) - prev.y,
                        ),
                      }))
                    }
                    min={50}
                    max={imageRef.current?.height || 400}
                    step={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rotation: {rotation}°</Label>
                  <Slider
                    value={[rotation]}
                    onValueChange={([value]) => setRotation(value)}
                    min={-180}
                    max={180}
                    step={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Scale: {scale.toFixed(1)}x</Label>
                  <Slider
                    value={[scale]}
                    onValueChange={([value]) => setScale(value)}
                    min={0.5}
                    max={2}
                    step={0.1}
                  />
                </div>
              </div>

              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRotation(0);
                    setScale(1);
                    // Reset to center crop
                    if (imageRef.current) {
                      const aspectRatio = getAspectRatio();
                      let width, height;
                      if (
                        imageRef.current.width / imageRef.current.height >
                        aspectRatio
                      ) {
                        height = imageRef.current.height * 0.8;
                        width = height * aspectRatio;
                      } else {
                        width = imageRef.current.width * 0.8;
                        height = width / aspectRatio;
                      }
                      setCropArea({
                        x: (imageRef.current.width - width) / 2,
                        y: (imageRef.current.height - height) / 2,
                        width,
                        height,
                      });
                    }
                  }}
                  className="w-auto"
                >
                  <RotateCw className="h-4 w-4 mr-1" />
                  Reset All
                </Button>
              </div>
            </div>

            {/* Preview Panel */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Preview</Label>
                <Badge variant="secondary">
                  {placement
                    .replace(/-/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                </Badge>
              </div>

              <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
                <div className="w-full flex justify-center">
                  <div
                    className={`border border-gray-300 rounded overflow-hidden bg-white ${
                      placement === "top-banner" ||
                      placement === "footer-banner"
                        ? "w-48 h-12"
                        : placement === "sidebar"
                          ? "w-24 h-36"
                          : placement === "inline-card"
                            ? "w-32 h-24"
                            : placement === "interstitial"
                              ? "w-24 h-40"
                              : "w-24 h-24"
                    }`}
                  >
                    {imageLoaded && imageRef.current ? (
                      <div
                        className="w-full h-full bg-gray-100"
                        style={{
                          backgroundImage: `url(${imageUrl})`,
                          backgroundPosition: `${-cropArea.x * (240 / imageRef.current.width)}px ${-cropArea.y * (240 / imageRef.current.height)}px`,
                          backgroundSize: `${240 * scale}px ${((240 * imageRef.current.height) / imageRef.current.width) * scale}px`,
                          backgroundRepeat: "no-repeat",
                          transform: `rotate(${rotation}deg)`,
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                        Live Preview
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-xs text-center text-gray-500 mt-2">
                  Live Preview
                </p>
              </div>

              {/* Crop Info */}
              <div className="space-y-2 text-sm text-gray-600">
                <div>Aspect Ratio: {getAspectRatio().toFixed(2)}:1</div>
                <div>
                  Crop Size: {Math.round(cropArea.width)}×
                  {Math.round(cropArea.height)}
                </div>
                <div>
                  Position: ({Math.round(cropArea.x)}, {Math.round(cropArea.y)})
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={applyCrop}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Apply Crop
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
