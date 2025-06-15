import { useRef } from "react";
import { Card } from "./card";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileSelect: (files: FileList) => void;
  accept?: string;
  multiple?: boolean;
  icon?: React.ReactNode;
  title: string;
  description: string;
  disabled?: boolean;
  variant?: 'default' | 'outline';
}

export function FileUpload({
  onFileSelect,
  accept = "*/*",
  multiple = false,
  icon,
  title,
  description,
  disabled = false,
  variant = 'default'
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      onFileSelect(files);
    }
    // Reset the input value so the same file can be selected again
    event.target.value = '';
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    if (!disabled) {
      const files = event.dataTransfer.files;
      if (files && files.length > 0) {
        onFileSelect(files);
      }
    }
  };

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
        variant === 'outline' 
          ? "border-gray-300 hover:border-nxt-blue" 
          : "border-gray-300 hover:border-nxt-blue",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
      
      <div className="space-y-4">
        <div className="mx-auto h-12 w-12 text-gray-400">
          {icon}
        </div>
        <div>
          <p className="text-lg font-medium nxt-gray-800">{title}</p>
          <p className="text-sm nxt-gray-500">{description}</p>
        </div>
        <Button
          type="button"
          variant={variant === 'outline' ? 'outline' : 'default'}
          className={cn(
            variant === 'outline' 
              ? "border-nxt-blue text-nxt-blue hover:bg-nxt-blue hover:text-white" 
              : "bg-nxt-blue text-white hover:bg-blue-700"
          )}
          disabled={disabled}
        >
          Choose Files
        </Button>
      </div>
    </div>
  );
}
