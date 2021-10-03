import { Injectable } from '@angular/core';

import { Camera, CameraResultType, CameraSource, ImageOptions, Photo } from '@capacitor/camera';
import { Directory, Filesystem, ReadFileOptions, WriteFileOptions } from '@capacitor/filesystem';
import { Storage } from '@capacitor/storage';
import { Platform } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';

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

  constructor(private platform: Platform) {
    this.platform = platform;
  }

  public async loadPhotos() {
    // Retrieve cached photo array data
    const photoList = await Storage.get({ key: this.PHOTO_STORAGE });
    this.photos = JSON.parse(photoList.value) || [];

    // Easiest way to detect when running on the web:
    // "when platform is NOT hybrid" do this"
    if (!this.platform.is('hybrid')) {
      // Display the photo by reading into  base64 format
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
  }

  public async deletePhoto(photo: PhotoStore, position: number) {
    // Remove this photo from photo reference data array
    this.photos.splice(position, 1);

    // Save to local storage
    this.saveToLocalStorage(this.photos);

    // Delete photo from the filesystem
    const filename = photo.filepath.substr(photo.filepath.lastIndexOf('/') + 1);

    await Filesystem.deleteFile({
      path: filename,
      directory: Directory.Data
    });
  }

  public async addNewToAlbum() {
    // Take a photo
    const capturedPhoto: Photo = await Camera.getPhoto(this.photoOption);

    // Save photo and add it to photo collection
    const savedPhoto = await this.savePhoto(capturedPhoto);
    this.photos.unshift(savedPhoto);

    // Save to local storage
    this.saveToLocalStorage(this.photos);
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

    if (this.platform.is('hybrid')) {
      // Display the new image by rewriting 'file://' path to HTTP
      // Details: https://ionicframework.com/docs/building/webview#file-protocol
      return {
        filepath: savedFile.uri,
        webviewPath: Capacitor.convertFileSrc(savedFile.uri)
      };
    } else {
      // Use webPath to display the new image instead of base64
      // since it is already loaded into memory
      return {
        filepath: filename,
        webviewPath: cameraPhoto.webPath
      };
    }
  }

  private async readAsBase64(cameraPhoto: Photo) {
    // Hybrid will detect Capacitor or Cordova
    if (this.platform.is('hybrid')) {
      // Read the file in base64 format
      const file = await Filesystem.readFile({
        path: cameraPhoto.path
      });

      return file.data;
    } else {
      // Fetch the photo, read as a blob, then convert to base64 format
      const response = await fetch(cameraPhoto.webPath);
      const blob = await response.blob();

      return await this.convertBlobToBase64(blob) as string;
    }
  }

  // Save to local storage
  private saveToLocalStorage(photos: PhotoStore[]) {
    Storage.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(photos)
    });
  }
}


