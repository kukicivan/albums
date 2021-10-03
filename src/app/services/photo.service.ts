import { Injectable } from '@angular/core';

import { Camera, CameraResultType, CameraSource, ImageOptions, Photo } from '@capacitor/camera';
import { Directory, Filesystem, ReadFileOptions, WriteFileOptions } from '@capacitor/filesystem';
import { Storage } from '@capacitor/storage';

export interface PhotoStore {
  filepath: string;
  webviewPath: string;
}

@Injectable({
  providedIn: 'root'
})
export class PhotoService {
  photos: PhotoStore[] = [];

  photoOption: ImageOptions = {
    resultType: CameraResultType.Uri,
    source: CameraSource.Camera,
    quality: 100
  };

  // eslint-disable-next-line @typescript-eslint/naming-convention
  private PHOTO_STORAGE = 'photos';

  constructor() {
  }

  public async loadPhotos() {
    // Retrieve cached photo array data
    const photoList = await Storage.get({ key: this.PHOTO_STORAGE });
    this.photos = JSON.parse(photoList.value) || [];

    // Display the photo by reading into base64 format
    for (const photo of this.photos) {
      // Read each saved photo data from the filesystem
      const fileOptions: ReadFileOptions = {
        path: photo.filepath,
        directory: Directory.Data
      };
      const readFile = await Filesystem.readFile(fileOptions);

      // Web platform only: Load the photo as base64 data
      photo.webviewPath = `data:image/jpeg;base64,${readFile.data}`;
    }
  }


  public async addNewToAlbum() {
    // Take a photo
    const capturedPhoto: Photo = await Camera.getPhoto(this.photoOption);

    // Save photo and add it to photo collection
    const savedPhoto = await this.savePhoto(capturedPhoto);
    this.photos.unshift(savedPhoto);

    // Save to local storage
    Storage.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos)
    });

  }

  convertBlobToBase64 = (blob: Blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.readAsDataURL(blob);
  });

  private async savePhoto(cameraPhoto: Photo) {
    // Convert photo to base64 format, required by Filesystem API to save
    const base64Data = await this.readAsBase64(cameraPhoto);

    // Write the file to the data directory
    const filename = new Date().getTime() + '.jpeg';
    const fileOptions: WriteFileOptions = {
      path: filename,
      data: base64Data,
      directory: Directory.Data
    };
    const savedFile = await Filesystem.writeFile(fileOptions);

    // Use webPath to display the new image instead of base64
    // since it is already loaded into memory
    return {
      filepath: filename,
      webviewPath: cameraPhoto.webPath
    };
  }

  private async readAsBase64(cameraPhoto: Photo) {
    // Fetch the photo, read as a blob, then convert to base64 format
    const response = await fetch(cameraPhoto.webPath);
    const blob = await response.blob();

    return await this.convertBlobToBase64(blob) as string;
  }
}


