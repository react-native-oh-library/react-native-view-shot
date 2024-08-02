/*
 * MIT License
 *
 * Copyright (C) 2023 Huawei Device Co., Ltd.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { TurboModule, TurboModuleContext } from '@rnoh/react-native-openharmony/ts';
import componentSnapshot from '@ohos.arkui.componentSnapshot';
import image from '@ohos.multimedia.image';
import fs from '@ohos.file.fs';
import photoAccessHelper from '@ohos.file.photoAccessHelper';
import promptAction from '@ohos.promptAction';
import { Context } from '@ohos.abilityAccessCtrl';
import window from '@ohos.window';
import { util } from '@kit.ArkTS';
import { BusinessError } from '@kit.BasicServicesKit';
import Logger from './Logger';

type Options = {
  fileName?: string,
  width?: number,
  height?: number,
  format: "png" | "jpg" | "webm" | "raw",
  quality: number,
  result: "tmpfile" | "base64" | "data-uri" | "zip-base64",
  snapshotContentContainer: boolean,
  handleGLSurfaceViewOnAndroid: boolean,
};

export class ViewShotTurboModule extends TurboModule {
  private phAccessHelper: photoAccessHelper.PhotoAccessHelper;
  private context: Context = getContext(this);

  constructor(ctx: TurboModuleContext) {
    super(ctx);
    this.phAccessHelper = photoAccessHelper.getPhotoAccessHelper(this.ctx.uiAbilityContext);
  }

  captureRef(tag: number, option: Options): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      componentSnapshot.get(tag + '').then(async (pixmap: image.PixelMap) => {
        if (option.result === 'base64') {
          this.getImageBase64(pixmap, option.format).then((base64) => {
            resolve(base64);
          }).catch((err: BusinessError) => {
            Logger.error(`componentSnapshot failed, message = ${err.message}`);
            reject(`componentSnapshot failed, message = ${err.message}`);
          })
        } else {
          this.savePhotoOnDevice('ComponentSnapshot', option, pixmap).then(uri => {
            resolve(uri);
          }).catch((err: BusinessError) => {
            Logger.error(`componentSnapshot failed, message = ${err.message}`);
            reject(`componentSnapshot failed, message = ${err.message}`);
          })
        }
      }).catch((err: BusinessError) => {
        Logger.error(`componentSnapshot failed, message = ${err.message}`);
        reject(`componentSnapshot failed, message = ${err.message}`);
      })
    })
  }

  captureScreen(option: Options): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
      window.getLastWindow(this.ctx.uiAbilityContext).then(windowClass => {
        windowClass.snapshot().then(async (pixmap) => {
          if (option.result === 'base64') {
            this.getImageBase64(pixmap, option.format).then((base64) => {
              resolve(base64);
            }).catch((err: BusinessError) => {
              Logger.error(`componentSnapshot failed, message = ${err.message}`);
              reject(`componentSnapshot failed, message = ${err.message}`);
            })
          } else {
            this.savePhotoOnDevice('ScreenSnapshot', option, pixmap).then(uri => {
              resolve(uri);
            }).catch((err: BusinessError) => {
              Logger.error(`componentSnapshot failed, message = ${err.message}`);
              reject(`componentSnapshot failed, message = ${err.message}`);
            })
          }
        })
      }).catch((err: BusinessError) => {
        Logger.error(`ScreenSnapshot failed, message = ${err.message}`);
        reject(`ScreenSnapshot failed, message = ${err.message}`);
      })

    })
  }

  releaseCapture(uri: string) {
    if (!uri.startsWith('file://')) {
      return;
    }
    let file = fs.openSync(uri, fs.OpenMode.READ_WRITE);
    let path = file.path;
    if (path == null) {
      return;
    }
    fs.access(path).then((res: boolean) => {
      if (!res) {
        return;
      }
      if (file.getParent() == this.ctx.uiAbilityContext.cacheDir) {
        fs.unlinkSync(path);
      }
    })
    fs.closeSync(file);
  }

  savePhotoOnDevice(title: string, option: Options, pixmap: image.PixelMap): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      let extension = option.format;
      let packOpts: image.PackingOption =
        { format: `image/${extension === 'jpg' ? 'jpeg' : 'png'}`, quality: option.quality * 100 };
      const imagePacker = image.createImagePacker();
      title = option.fileName ? option.fileName : title + '-' + this.getNowTime();
      const path: string = this.context.filesDir + `/${title}.${extension}`;
      let photoCreateConfigs: Array<photoAccessHelper.PhotoCreationConfig> = [
        {
          title,
          fileNameExtension: extension,
          photoType: photoAccessHelper.PhotoType.IMAGE,
          subtype: photoAccessHelper.PhotoSubtype.DEFAULT
        }
      ];
      this.phAccessHelper.showAssetsCreationDialog([path], photoCreateConfigs).then((res) => {
        imagePacker.packing(pixmap, packOpts).then(data => {
          let file = fs.openSync(res[0], fs.OpenMode.READ_WRITE);
          fs.writeSync(file.fd, data);
          fs.closeSync(file);
          promptAction.showToast({
            message: '已成功保存至相册',
            duration: 1000
          })
          resolve(res[0]);
        }).catch((error: BusinessError) => {
          Logger.error(`Failed to pack the image. And the error is: ${JSON.stringify(error)}`);
          reject(`Failed to pack the image. And the error is: ${JSON.stringify(error)}`);
        })
      }).catch((error: BusinessError) => {
          Logger.error(`Failed to save the image. And the error is: ${JSON.stringify(error)}`);
          reject(`Failed to save the image. And the error is: ${JSON.stringify(error)}`);
        })
    })
  }

  getNowTime(): string {
    let date = new Date();
    let year = date.getFullYear().toString();
    let month = date.getMonth() + 1;
    let day = date.getDay();
    let hours = date.getHours().toString();
    let minutes = date.getMinutes().toString();
    let seconds = date.getSeconds().toString();
    let milliseconds = date.getMilliseconds().toString();
    return year + (month > 10 ? month : '0' + month) + (day > 10 ? day : '0' + day) + hours + minutes + seconds +
      milliseconds;
  }

  async getImageBase64(pixmap: image.PixelMap, format: string): Promise<string> {
    const imagePackageApi: image.ImagePacker = image.createImagePacker();
    let packOpts: image.PackingOption = {
      format: `image/${format === 'jpg' ? 'jpeg' : 'png'}`,
      quality: 100,
    }
    const readBuffer: ArrayBuffer = await imagePackageApi.packing(pixmap, packOpts);
    let base64Helper = new util.Base64Helper();
    let uint8Arr = new Uint8Array(readBuffer);
    let pixelStr = base64Helper.encodeToStringSync(uint8Arr);
    return pixelStr;
  }
}