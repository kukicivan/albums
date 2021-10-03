import { Component, OnInit } from '@angular/core';

import { ActionSheetController } from '@ionic/angular';

import { PhotoService, PhotoStore } from '../services/photo.service';

@Component({
  selector: 'app-albums',
  templateUrl: './albums.page.html',
  styleUrls: ['./albums.page.scss']
})
export class AlbumsPage implements OnInit {

  constructor(
    private photoService: PhotoService,
    private actionSheetController: ActionSheetController
  ) {
  }

  async ngOnInit() {
    await this.photoService.loadPhotos();
  }

  addPhotoToAlbum(): void {
    this.photoService.addNewToAlbum().then(r => {
      console.log('r', r);
    });
  }

  public async showActionSheet(photo: PhotoStore, position: number) {
    const actionSheet = await this.actionSheetController.create({
      header: 'Photos',
      buttons: [{
        text: 'Delete',
        role: 'destructive',
        icon: 'trash',
        handler: () => {
          this.photoService.deletePhoto(photo, position);
        }
      },
        {
          text: 'Cancel',
          role: 'cancel',
          icon: 'close',
          handler: () => {
            // Nothing to do, action sheet is automatically closed
          }
        }
      ]
    });

    await actionSheet.present();
  }

}
