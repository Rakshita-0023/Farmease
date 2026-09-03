export type ApiMeta={timestamp:string;requestId:string;provider?:string;cache?:'hit'|'miss'};
export type ApiEnvelope<T>={data:T;meta:ApiMeta};
export class FarmEaseError extends Error { constructor(message:string, public status?:number, public code?:string, public details?:unknown){super(message);this.name='FarmEaseError';} }
export type ClientOptions={baseUrl:string;token?:string;timeoutMs?:number;fetch?:typeof fetch};
export class FarmEase {
  private fetcher:typeof fetch; private timeoutMs:number;
  constructor(private options:ClientOptions){this.fetcher=options.fetch||fetch;this.timeoutMs=options.timeoutMs||15000;}
  private async request<T>(method:string,path:string,body?:unknown):Promise<T>{const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),this.timeoutMs);try{const isFormData=typeof FormData!=='undefined'&&body instanceof FormData;const response=await this.fetcher(`${this.options.baseUrl.replace(/\/$/,'')}${path}`,{method,headers:{'Accept':'application/json',...(body&&!isFormData?{'Content-Type':'application/json'}:{}),...(this.options.token?{Authorization:`Bearer ${this.options.token}`}:{})},body:body?(isFormData?body:JSON.stringify(body)):undefined,signal:controller.signal});const json=await response.json() as ApiEnvelope<T>&{error?:{message:string;code?:string;details?:unknown}};if(!response.ok||json.error)throw new FarmEaseError(json.error?.message||`FarmEase request failed (${response.status})`,response.status,json.error?.code,json.error?.details);return json.data;}catch(e){if(e instanceof FarmEaseError)throw e;throw new FarmEaseError(`FarmEase request failed: ${(e as Error).message}`);}finally{clearTimeout(timer);}}
  weather={current:(lat:number,lon:number,provider?:string)=>this.request<unknown>('GET',`/weather/current?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}${provider?`&provider=${encodeURIComponent(provider)}`:''}`),forecast:(lat:number,lon:number,provider?:string)=>this.request<unknown>('GET',`/weather/forecast?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}${provider?`&provider=${encodeURIComponent(provider)}`:''}`)};
  markets={prices:(params:Record<string,string|number|undefined>={})=>this.request<unknown>('GET','/markets?'+new URLSearchParams(Object.entries(params).filter(([,v])=>v!==undefined).map(([k,v])=>[k,String(v)])))};
  cropRecommendation=(context:Record<string,unknown>)=>this.request<unknown>('POST','/crop-recommendation',context);
  advisories=(context:Record<string,unknown>)=>this.request<unknown>('POST','/advisories',context);
  plantDiagnosis=async(image:Blob,options:{filename?:string;contentType?:string}={})=>{
    if (!(image instanceof Blob)) throw new FarmEaseError('Plant diagnosis image must be a Blob or File');
    const form=new FormData();
    const filename=options.filename||'plant.jpg';
    const contentType=options.contentType||image.type||'image/jpeg';
    const upload=image.type===contentType?image:new Blob([image],{type:contentType});
    form.append('file',upload,filename);
    return this.request<unknown>('POST','/plant-diagnosis',form);
  };
  fieldHealth=(farmId:string,provider?:string)=>this.request<unknown>('GET',`/farms/${encodeURIComponent(farmId)}/field-health${provider?`?provider=${encodeURIComponent(provider)}`:''}`);
  alerts=(farmId:string)=>this.request<unknown>('GET',`/farms/${encodeURIComponent(farmId)}/alerts`);
  evaluateAlerts=(farmId:string,context:Record<string,unknown>)=>this.request<unknown>('POST',`/farms/${encodeURIComponent(farmId)}/alerts/evaluate`,context);
}
