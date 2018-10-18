import { statSync } from 'fs';
import { join, relative, sep } from 'path';
import * as qiniu from 'qiniu';
import * as gs from 'glob-stream';
import * as through2 from 'through2';

import { askBuckets } from '../utils/ask';

import { checkTokens } from '../utils/token';
import { bucketList, bucketHostNames } from '../apis';
import * as renderer from '../utils/renderer';

const cwd = process.cwd();

export interface UploadFileOptions {
  fileDir: string;
  key: string;
  basePath: string;
  putPolicy: qiniu.rs.PutPolicy;
  mac: qiniu.auth.digest.Mac;
  qiniuConf: qiniu.conf.Config;
}
export const uploadFile = async ({
  fileDir,
  key,
  basePath,
  putPolicy,
  mac,
  qiniuConf
}: UploadFileOptions): Promise<any> => {
  // const readable = createReadStream(dir);
  // return await uploadStream({
  //   stream: readable,
  //   key: join(basePath, key),
  //   putPolicy,
  //   mac,
  //   qiniuConf
  // });

  const token = putPolicy.uploadToken(mac);
  const putExtra = new qiniu.form_up.PutExtra();
  const formUploader = new qiniu.form_up.FormUploader(qiniuConf);
  return new Promise((resolve, reject) => {
    formUploader.putFile(token, join(basePath, key), fileDir, putExtra, (err: Error, body: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(body);
      }
    });
  });

}

export interface UploadStreamOptions {
  stream: NodeJS.ReadableStream,
  key: string;
  putPolicy: qiniu.rs.PutPolicy;
  mac: qiniu.auth.digest.Mac;
  qiniuConf: qiniu.conf.Config;
}

export const uploadStream = async ({ stream, key, putPolicy, mac, qiniuConf }: UploadStreamOptions) => {
  const token = putPolicy.uploadToken(mac);
  const putExtra = new qiniu.form_up.PutExtra();
  const formUploader = new qiniu.form_up.FormUploader(qiniuConf);
  return new Promise((resolve, reject) => {
    formUploader.putStream(token, key, stream, putExtra, (err: Error, body: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(body);
      }
    });
  });
}


export interface CheckFileOptions {
  dir: string;
  basePath: string;
  key: string;
  mac: qiniu.auth.digest.Mac;
  qiniuConf: qiniu.conf.Config;
  bucket: string;
}

export const checkFile = ({ basePath, key, mac, qiniuConf, bucket }: CheckFileOptions) => {
  return new Promise((resolve, reject) => {
    const bucketManager = new qiniu.rs.BucketManager(mac, qiniuConf);
    bucketManager.stat(bucket, join(basePath, key), (err, _, info) => {
      if (err) {
        reject(err);
      } else {
        if (info.data.error) {
          resolve(true);
        } else {
          /* tslint:disable-next-line */
          console.log(`文件已经存在 覆盖上传 → ${key}`);
          // resolve(false); // todo
          resolve(true);
        }
      }
    });
  });
}

export interface QiniuUploaderOption {
  basePath?: string;
  dist: string | string[];
  bucket: string;
}

export interface QiniuUploaderReturn {
  url: string;
}

export default async ({ dist, basePath, bucket }: QiniuUploaderOption) : Promise<QiniuUploaderReturn> => {

  if( !bucket ) {
    const buckets = await bucketList();
    bucket = (await askBuckets(buckets)).bucket;
  }
  const hostnames = await bucketHostNames(bucket);
  renderer.hostnames(hostnames, bucket);
  let $basePath: string;
  if (!basePath) {
    $basePath = '';
  } else {
    $basePath = basePath;
  }
  const hostname = hostnames[0] || '';
  const { ak, sk } = await checkTokens();
  const mac = new qiniu.auth.digest.Mac(ak, sk);
  const putPolicy =  new qiniu.rs.PutPolicy({
    scope: bucket,
    returnBody: '{"key":"$(key)","hash":"$(etag)","fsize":$(fsize),"bucket":"$(bucket)","name":"$(x:name)"}',
  });
  const qiniuConf = new qiniu.conf.Config();
  
  const uploadRes = await new Promise((resolve, reject) => {
    if (Array.isArray(dist)) {
      dist = dist.map(i => join(cwd, i));
    } else {
      dist = join(cwd, dist);
    }
    const stream = gs(dist)
      .pipe(through2.obj(async(file, _, next) => {
        let filePath = relative(file.base, file.path);
        filePath = filePath.split(sep).join('/');
        // console.log(filePath);
        if(!statSync(file.path).isFile()) {
          next();
          return;
        }
        // const need = await checkFile({
        //   dir: file.path,
        //   basePath: $basePath,
        //   key: filePath,
        //   mac,
        //   qiniuConf,
        //   bucket
        // });
        // if (!need) {
        //   next();
        //   return;
        // }
        /* tslint:disable-next-line */
        console.log(`uploading → ${filePath} ...`);
        const body = await uploadFile({
          fileDir: file.path,
          key: filePath,
          putPolicy,
          qiniuConf,
          mac,
          basePath: $basePath,
        });
        /* tslint:disable-next-line */
        console.log(`success upload -> ${hostname ? `http://${hostname}`: ''}/${body.key}`);
        next();
      }));
    stream.on('data', () => { });
    stream.on('end', () => resolve({
      url: `http://${hostname}/`
    }));
    stream.on('error', reject);
  }).catch((err)=>{
    console.log('ERROR: ', err)
  }) as QiniuUploaderReturn;

  return {
    url: uploadRes.url
  };

}
