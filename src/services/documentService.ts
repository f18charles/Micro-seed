import { useState } from 'react';
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db, storage } from '../firebase';
import { SubmittedDocument, DocumentStatus, DocumentType } from '../types';

export const documentService = {
  async uploadDocument(
    file: File, 
    userId: string, 
    metadata: Partial<SubmittedDocument>
  ): Promise<SubmittedDocument> {
    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File size exceeds 10MB limit');
    }

    // Validate MIME type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only JPEG, PNG, WEBP, and PDF are allowed.');
    }

    const docId = 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const timestamp = Date.now();
    const filePath = `documents/${userId}/${metadata.type || 'other'}/${timestamp}_${file.name}`;
    const storageRef = ref(storage, filePath);

    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        null,
        (error) => reject(error),
        async () => {
          const fileUrl = await getDownloadURL(uploadTask.snapshot.ref);
          
          const newDoc: SubmittedDocument = {
            id: docId,
            userId,
            businessId: metadata.businessId,
            loanApplicationId: metadata.loanApplicationId,
            guarantorId: metadata.guarantorId,
            type: metadata.type as DocumentType,
            fileName: file.name,
            fileUrl,
            filePath,
            mimeType: file.type,
            fileSizeBytes: file.size,
            uploadedAt: serverTimestamp() as any,
            status: 'pending_review',
            periodCovered: metadata.periodCovered,
          };

          await setDoc(doc(db, 'documents', docId), newDoc);
          resolve(newDoc);
        }
      );
    });
  },

  async deleteDocument(docData: SubmittedDocument): Promise<void> {
    const storageRef = ref(storage, docData.filePath);
    await deleteObject(storageRef);
    await deleteDoc(doc(db, 'documents', docData.id));
  },

  async getDocumentsForApplication(applicationId: string): Promise<SubmittedDocument[]> {
    const q = query(collection(db, 'documents'), where('loanApplicationId', '==', applicationId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => d.data() as SubmittedDocument);
  },

  async getDocumentsForUser(userId: string): Promise<SubmittedDocument[]> {
    const q = query(collection(db, 'documents'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => d.data() as SubmittedDocument);
  },

  async updateDocumentStatus(
    docId: string, 
    status: DocumentStatus, 
    reviewedBy: string, 
    rejectionReason?: string
  ): Promise<void> {
    await updateDoc(doc(db, 'documents', docId), {
      status,
      reviewedBy,
      reviewedAt: serverTimestamp(),
      rejectionReason: rejectionReason || null
    });
  }
};

export function useDocumentUpload() {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File, userId: string, metadata: Partial<SubmittedDocument>): Promise<SubmittedDocument | null> => {
    setIsUploading(true);
    setError(null);
    setProgress(0);

    try {
      const docId = 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      const timestamp = Date.now();
      const filePath = `documents/${userId}/${metadata.type || 'other'}/${timestamp}_${file.name}`;
      const storageRef = ref(storage, filePath);

      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setProgress(p);
          },
          (err) => {
            setError(err.message);
            setIsUploading(false);
            reject(err);
          },
          async () => {
            const fileUrl = await getDownloadURL(uploadTask.snapshot.ref);
            
            const newDoc: SubmittedDocument = {
              id: docId,
              userId,
              businessId: metadata.businessId,
              loanApplicationId: metadata.loanApplicationId,
              guarantorId: metadata.guarantorId,
              type: metadata.type as DocumentType,
              fileName: file.name,
              fileUrl,
              filePath,
              mimeType: file.type,
              fileSizeBytes: file.size,
              uploadedAt: serverTimestamp() as any,
              status: 'pending_review',
              periodCovered: metadata.periodCovered,
            };

            await setDoc(doc(db, 'documents', docId), newDoc);
            setIsUploading(false);
            resolve(newDoc);
          }
        );
      });
    } catch (err: any) {
      setError(err.message);
      setIsUploading(false);
      return null;
    }
  };

  const reset = () => {
    setProgress(0);
    setIsUploading(false);
    setError(null);
  };

  return { upload, progress, isUploading, error, reset };
}
