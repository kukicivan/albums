import { Component, OnInit } from '@angular/core';
import { PhotoService } from '../services/photo.service';

@Component({
  selector: 'app-albums',
  templateUrl: './albums.page.html',
  styleUrls: ['./albums.page.scss']
})
export class AlbumsPage implements OnInit {

  constructor(private photoService: PhotoService) {
  }

  async ngOnInit() {
    await this.photoService.loadPhotos();
  }

  addPhotoToAlbum(): void {
    this.photoService.addNewToAlbum().then(r => {
      console.log('r', r);
    });
  }

}
