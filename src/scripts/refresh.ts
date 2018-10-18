import { refreshResource } from '../apis';
import { askUrl } from '../utils/ask';



export interface QiniuRefreshOption {
  url: string;
}

export const refresh = async ( { url }: QiniuRefreshOption) => {
  if(!url){
    const { value } = await askUrl();
    url = value;
  }
  await refreshResource({
    urls: [url]
  })
}
