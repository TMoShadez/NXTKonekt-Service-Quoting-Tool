import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { Camera, FileUp, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface StepFileUploadProps {
  assessmentId: number;
}

export function StepFileUpload({ assessmentId }: StepFileUploadProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: files = [], isLoading } = useQuery({
    queryKey: ["/api/assessments", assessmentId, "files"],
    queryFn: async () => {
      const response = await fetch(`/api/assessments/${assessmentId}/files`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!assessmentId,
  });

  const uploadFilesMutation = useMutation({
    mutationFn: async ({ files, fileType }: { files: FileList; fileType: 'photo' | 'document' }) => {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });
      formData.append('fileType', fileType);

      const response = await fetch(`/api/assessments/${assessmentId}/files`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assessments", assessmentId, "files"] });
      toast({
        title: "Success",
        description: "Files uploaded successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to upload files",
        variant: "destructive",
      });
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: number) => {
      await apiRequest("DELETE", `/api/files/${fileId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assessments", assessmentId, "files"] });
      toast({
        title: "Success",
        description: "File deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (files: FileList, fileType: 'photo' | 'document') => {
    uploadFilesMutation.mutate({ files, fileType });
  };

  const handleDeleteFile = (fileId: number) => {
    deleteFileMutation.mutate(fileId);
  };

  const photos = files.filter((file: any) => file.fileType === 'photo');
  const documents = files.filter((file: any) => file.fileType === 'document');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold nxt-gray-800">
          Site Documentation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {/* Photo Upload */}
          <div>
            <h3 className="text-lg font-semibold nxt-gray-800 mb-4">Site Photos</h3>
            <FileUpload
              onFileSelect={(files) => handleFileUpload(files, 'photo')}
              accept="image/*"
              multiple
              icon={<Camera className="text-4xl" />}
              title="Upload Site Photos"
              description="Drag and drop or click to select image files"
              disabled={uploadFilesMutation.isPending}
            />
            
            {/* Uploaded Photos Preview */}
            {photos.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                {photos.map((photo: any) => (
                  <div key={photo.id} className="relative group">
                    <img 
                      src={`/api/files/photo/${photo.fileName}`}
                      alt={photo.originalName}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDeleteFile(photo.id)}
                      disabled={deleteFileMutation.isPending}
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Document Upload */}
          <div>
            <h3 className="text-lg font-semibold nxt-gray-800 mb-4">Supporting Documents</h3>
            <FileUpload
              onFileSelect={(files) => handleFileUpload(files, 'document')}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.dwg"
              multiple
              icon={<FileUp className="text-4xl" />}
              title="Upload Documents"
              description="Floor plans, network diagrams, specifications (PDF, DOC, DWG)"
              disabled={uploadFilesMutation.isPending}
              variant="outline"
            />
            
            {/* Uploaded Documents List */}
            {documents.length > 0 && (
              <div className="mt-4 space-y-2">
                {documents.map((doc: any) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-nxt-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileUp className="text-blue-500" size={16} />
                      <span className="text-sm nxt-gray-800">{doc.originalName}</span>
                      <span className="text-xs nxt-gray-500">
                        ({(doc.fileSize / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteFile(doc.id)}
                      disabled={deleteFileMutation.isPending}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
