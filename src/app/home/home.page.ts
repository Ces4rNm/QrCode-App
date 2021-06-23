import { Component, ElementRef, ViewChild } from '@angular/core';
import { LoadingController, ToastController } from '@ionic/angular';

import jsQR from 'jsqr';

import { Platform } from '@ionic/angular';

import { Filesystem, Directory } from '@capacitor/filesystem';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  qrData: string = '';
  createCode = 'https://www.linkedin.com/in/cesar-alejandro-nu%C3%B1ez-mari%C3%B1o-a0042896/';

  stream: any;
  scanActive: boolean = false;
  scanResult: any = null;

  @ViewChild('video', { static: false }) video: ElementRef;
  @ViewChild('canvas', { static: false }) canvas: ElementRef;

  videoElement: any;
  canvasElement: any;
  canvasContext: any;


  loading: HTMLIonLoadingElement;

  constructor(private toastCtrl: ToastController, private loadingCtrl: LoadingController, public platform: Platform) { }

  ngAfterViewInit(): void {
    this.videoElement = this.video.nativeElement;
    this.canvasElement = this.canvas.nativeElement;
    this.canvasContext = this.canvas.nativeElement.getContext('2d');

    if (this.platform.is('desktop')) {
      console.log('🆗 desktop');
    } else if (this.platform.is('ios')) {
      console.log('🆗 ios');
    } else if (this.platform.is('android')) {
      console.log('🆗 android');
    }
  }

  async startScan() {
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }
    });
    this.videoElement.srcObject = this.stream;
    this.videoElement.setAttribute('playsinline', true);
    this.videoElement.play();

    this.loading = await this.loadingCtrl.create({});
    await this.loading.present();

    requestAnimationFrame(this.scan.bind(this));
  }

  async scan() {
    console.log("🚀 ~ HomePage ~ scan");
    if (this.videoElement.readyState == this.videoElement.HAVE_ENOUGH_DATA) {
      if (this.loading) {
        await this.loading.dismiss();
        this.loading = null;
        this.scanActive = true;
      }
      this.canvasElement.height = this.videoElement.videoHeight;
      this.canvasElement.width = this.videoElement.videoWidth;

      this.canvasContext.drawImage(
        this.videoElement,
        0,
        0,
        this.canvasElement.width,
        this.canvasElement.height
      );

      const imageData = this.canvasContext.getImageData(
        0,
        0,
        this.canvasElement.width,
        this.canvasElement.height
      )

      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert'
      })
      console.log("🚀 ~ HomePage ~ scan ~ code", code)

      if (code) {
        console.log("🚩")
        this.videoElement.pause();
        this.scanActive = false;
        this.scanResult = code.data;
        this.stream.getTracks().forEach(function (track) {
          track.stop();
        });
      } else {
        if (this.scanActive) {
          requestAnimationFrame(this.scan.bind(this));
        }

      }
    } else {
      requestAnimationFrame(this.scan.bind(this));
    }
  }

  resetScan() {
    this.scanResult = null;
  }

  stopScan() {
    this.videoElement.pause();
    this.scanActive = false;
    this.stream.getTracks().forEach(function (track) {
      track.stop();
    });
  }

  async toastQRSaved() {
    const toast = await this.toastCtrl.create({
      duration: 2000,
      message: '[Codigo-QR.png] saved in Documents',
      position: 'bottom',
      buttons: [
        {
          text: 'Open',
          handler: () => {
            window.open(this.scanResult, '_system', 'location=yes');
          }
        }
      ]
    });
    toast.present();
  }

  async shareImage() {

    let x = document.getElementsByClassName('qr-code-img');
    let y = x[0].children[0].getAttribute('src');

    if (this.platform.is('desktop')) {

      var a = document.createElement("a");
      a.href = y;
      a.download = "Codigo-QR.png";
      a.click();
      a.remove();

    } else if (this.platform.is('ios') || this.platform.is('android')) {

      const base64Data = y;

      const writeSecretFile = async () => {
        await Filesystem.writeFile({
          path: 'Codigo-qr.png',
          data: base64Data,
          directory: Directory.Documents,
        });
      };

      writeSecretFile();

      this.toastQRSaved();

    }
  }




}
