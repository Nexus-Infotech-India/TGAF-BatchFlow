import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';


const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';


if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Make sure SUPABASE_URL and SUPABASE_SERVICE_KEY are set in your environment');
}

const supabase = createClient(supabaseUrl, supabaseKey);


const getContentType = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  const contentTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'txt': 'text/plain',
    'csv': 'text/csv',
    'zip': 'application/zip',
  };

  return contentTypes[extension] || 'application/octet-stream';
};

export const uploadFileToSupabase = async (
  fileBuffer: Buffer,
  fileName: string,
  bucketName: string = 'training-documents',
  folder: string = ''
): Promise<{ url: string; path: string; error: null } | { url: null; path: null; error: Error }> => {
  try {
    // Generate a unique file name to prevent collisions
    const fileExtension = fileName.split('.').pop() || '';
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    
    // Create the full path including folder if provided
    const filePath = folder ? `${folder}/${uniqueFileName}` : uniqueFileName;
    
    // Upload the file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, fileBuffer, {
        contentType: getContentType(fileName),
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }
    
    // Get the public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);
    
    return {
      url: urlData.publicUrl,
      path: filePath,
      error: null
    };
  } catch (error) {
    console.error('Error uploading file to Supabase:', error);
    return {
      url: null,
      path: null,
      error: error instanceof Error ? error : new Error('Unknown error occurred during upload')
    };
  }
};


export const deleteFileFromSupabase = async (
  filePath: string,
  bucketName: string = 'training-documents'
): Promise<{ success: boolean; error: null } | { success: false; error: Error }> => {
  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);
    
    if (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
    
    return {
      success: true,
      error: null
    };
  } catch (error) {
    console.error('Error deleting file from Supabase:', error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Unknown error occurred during deletion')
    };
  }
};