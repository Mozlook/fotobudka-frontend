type UploadFileToPresignedUrlOptions = {
  file: File;
  putUrl: string;
  mimeType: string;
  onProgress?: (progress: number) => void;
};

export function uploadFileToPresignedUrl({
  file,
  putUrl,
  mimeType,
  onProgress,
}: UploadFileToPresignedUrlOptions) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open("PUT", putUrl);
    xhr.withCredentials = false;

    if (mimeType) {
      xhr.setRequestHeader("Content-Type", mimeType);
    }

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) {
        return;
      }

      const progress = Math.round((event.loaded / event.total) * 100);
      onProgress?.(progress);
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
        return;
      }

      reject(
        new Error(
          `Upload do storage nie powiódł się. Status storage: ${xhr.status}.`,
        ),
      );
    };

    xhr.onerror = () => {
      reject(new Error("Upload do storage nie powiódł się."));
    };

    xhr.onabort = () => {
      reject(new Error("Upload został przerwany."));
    };

    xhr.send(file);
  });
}
