import * as request from 'request-promise';
import { checkTokens } from './utils/token';
import * as qiniu from 'qiniu';

interface RefreshParams {
  urls: string[];
}

export const refreshResource = async (params: RefreshParams): Promise<any> => {
  // const { ak, sk } = await checkTokens();
  // const mac = new qiniu.auth.digest.Mac(ak, sk);
  // const accessToken = qiniu.util.generateAccessToken(mac, '/v2/tune/refresh', '');
  // const zone = qiniu.zone.Zone_z0;
  // const result = await request({
  //   baseUrl: `https://${zone.apiHost}`,
  //   method: 'POST',
  //   uri: '/v2/tune/refresh',
  //   body: JSON.stringify(params),
  //   headers: {
  //     Authorization: accessToken,
  //   }
  // })
  // console.log(result);
  const { ak, sk } = await checkTokens();
  const mac = new qiniu.auth.digest.Mac(ak, sk);
  const cdnm = new qiniu.cdn.CdnManager(mac);
  return new Promise((resolve, reject)=>{
    cdnm.refreshUrls(params.urls, function(err, respBody, respInfo) {
      if (err) {
        reject(err);
        return;
      }
      console.log(respInfo.statusCode);
      var jsonBody = JSON.parse(respBody);
      resolve(jsonBody);
      console.log(jsonBody);
    })
  });

}

export const bucketList = async (): Promise<string[]> => {
  const { ak, sk } = await checkTokens();
  const mac = new qiniu.auth.digest.Mac(ak, sk);
  const accessToken = qiniu.util.generateAccessToken(mac, '/buckets', '');
  const zone = qiniu.zone.Zone_z0;
  const data = await request({
    baseUrl: `https://${zone.rsHost}`,
    uri: '/buckets',
    headers: {
      Authorization: accessToken,
    }
  })
  try {
    return JSON.parse(data);
  } catch (_) {
    return data;
  }
}

export const bucketHostNames = async (bucket: string): Promise<string[]> => {
  const { ak, sk } = await checkTokens();
  const mac = new qiniu.auth.digest.Mac(ak, sk);
  const uri = `/v6/domain/list?tbl=${bucket}`
  const accessToken = qiniu.util.generateAccessToken(mac, uri, '');
  const zone = qiniu.zone.Zone_z0;
  const data = await request({
    baseUrl: `https://${zone.apiHost}`,
    uri,
    headers: {
      Authorization: accessToken,
    }
  })
  try {
    return JSON.parse(data);
  } catch (_) {
    return data;
  }
}
