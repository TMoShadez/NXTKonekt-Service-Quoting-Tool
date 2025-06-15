import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { storage } from '../storage';

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create subdirectories for different file types
const photosDir = path.join(uploadsDir, 'photos');
const documentsDir = path.join(uploadsDir, 'documents');

if (!fs.existsSync(photosDir)) {
  fs.mkdirSync(photosDir, { recursive: true });
}

if (!fs.existsSync(documentsDir)) {
  fs.mkdirSync(documentsDir, { recursive: true });
}

// Configure multer storage
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const fileType = req.body.fileType || 'document';
    const uploadPath = fileType === 'photo' ? photosDir : documentsDir;
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter for security
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const fileType = req.body.fileType || 'document';
  
  if (fileType === 'photo') {
    // Allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for photos'));
    }
  } else {
    // Allow document files
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/vnd.dwg',
      'application/acad',
      'application/x-dwg',
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX, XLS, XLSX, and DWG files are allowed for documents'));
    }
  }
};

export const upload = multer({
  storage: multerStorage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

export async function saveFileToDatabase(
  assessmentId: number,
  file: Express.Multer.File,
  fileType: 'photo' | 'document'
) {
  return await storage.createUploadedFile({
    assessmentId,
    fileName: file.filename,
    originalName: file.originalname,
    fileType,
    mimeType: file.mimetype,
    fileSize: file.size,
    filePath: file.path,
  });
}

export function deleteFileFromDisk(filePath: string) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}
