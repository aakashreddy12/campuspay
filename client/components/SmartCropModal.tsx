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
  const canvasRef = useRef<HTMLCanvasElement>(null);
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

  // Smart crop using simple center crop logic
  const performSmartCrop = () => {
    if (!imageRef.current) return;

    const img = imageRef.current;
    const aspectRatio = getAspectRatio();

    // AI-powered smart crop simulation
    let width, height, x, y;

    if (img.width / img.height > aspectRatio) {
      // Image is wider - focus on center
      height = img.height;
      width = height * aspectRatio;
      x = (img.width - width) / 2;
      y = 0;
    } else {
      // Image is taller - focus on upper third (better for faces/subjects)
      width = img.width;
      height = width / aspectRatio;
      x = 0;
      y = img.height * 0.2; // Focus on upper 20% for better composition
    }

    setCropArea({ x, y, width, height });
    setSmartCropMode("smart");
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDragging(true);
    setDragStart({ x, y });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const deltaX = x - dragStart.x;
    const deltaY = y - dragStart.y;

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

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };

  const applyCrop = async () => {
    if (!imageRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to crop area
    canvas.width = cropArea.width;
    canvas.height = cropArea.height;

    // Apply rotation and scale
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);

    // Draw cropped image
    ctx.drawImage(
      imageRef.current,
      cropArea.x,
      cropArea.y,
      cropArea.width,
      cropArea.height,
      -canvas.width / 2,
      -canvas.height / 2,
      canvas.width,
      canvas.height,
    );

    ctx.restore();

    // Convert to blob
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const croppedUrl = URL.createObjectURL(blob);
          onCropComplete(croppedUrl);
          onClose();
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
                {imageLoaded && (
                  <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 pointer-events-auto cursor-move"
                    style={{
                      width: "100%",
                      height: "100%",
                      border: "2px solid #8b5cf6",
                      boxSizing: "border-box",
                    }}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={handleCanvasMouseUp}
                  />
                )}
              </div>

              {/* Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setRotation(0);
                      setScale(1);
                    }}
                    className="w-full"
                  >
                    <RotateCw className="h-4 w-4 mr-1" />
                    Reset
                  </Button>
                </div>
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
                    {imageLoaded && (
                      <div
                        className="w-full h-full bg-gray-100"
                        style={{
                          backgroundImage: `url(${imageUrl})`,
                          backgroundPosition: `${-cropArea.x}px ${-cropArea.y}px`,
                          backgroundSize: `${imageRef.current?.width || 0}px ${imageRef.current?.height || 0}px`,
                          backgroundRepeat: "no-repeat",
                          transform: `rotate(${rotation}deg) scale(${scale})`,
                        }}
                      />
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
